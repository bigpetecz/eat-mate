import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(
    googleId: string,
    email: string,
    password: string,
    displayName: string
  ) {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      password: hash,
      displayName,
      googleId,
    });
    return user.save();
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  private generateJwt(user: User) {
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, displayName: user.displayName },
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.generateJwt(user);
  }

  async validateGoogleUser(profile: any): Promise<any> {
    if (!profile) throw new Error('Google profile is undefined');
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    // Try to find the user in your DB by Google ID or email.
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        googleId: id,
        displayName,
        picture: profile.photos?.[0]?.value || '',
      });
    }

    if (id !== user?.googleId) {
      // If the Google ID doesn't match, update it
      user.googleId = id;
      user.picture = profile.photos?.[0]?.value || '';
      await user.save();
    }

    return this.generateJwt(user);
  }
}
