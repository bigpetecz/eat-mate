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
import { RegisterDto } from './dto/register.dto';
import { UserProfileDto } from './dto/user-profile.dto';

interface GoogleProfile {
  id: string;
  emails?: Array<{ value: string }>;
  displayName: string;
  photos?: Array<{ value: string }>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  private mapToSafeUser(user: User): UserProfileDto {
    return {
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      theme: user.theme,
      picture: user.picture,
      gender: user.gender,
    };
  }

  async register(dto: RegisterDto) {
    const { displayName, email, password } = dto;
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const existingDisplayName = await this.userModel.findOne({ displayName });
    if (existingDisplayName) {
      throw new ConflictException('Display name is already taken');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      password: hash,
      displayName,
      googleId: null,
    });
    await user.save();
    return this.mapToSafeUser(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getSafeUserByEmail(email: string): Promise<UserProfileDto | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return null;
    }
    return this.mapToSafeUser(user);
  }

  private generateJwt(user: User) {
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.mapToSafeUser(user),
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.generateJwt(user);
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<{
    access_token: string;
    user: UserProfileDto;
  }> {
    if (!profile) throw new Error('Google profile is undefined');
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
      throw new Error('Google profile does not contain an email');
    }

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
