'use client';

// useTheme is now handled in the parent
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { apiClient } from '@/app/api-client';
import { useAuthStore, User } from '../../auth/authStore';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ApiClientError } from '@/lib/api-error';
import { toast } from 'sonner';

const settingsSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  theme: z.enum(['auto', 'light', 'dark']),
  gender: z.enum(['male', 'female']).nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  user: User | null;
  dict: Record<string, string>;
}

export function SettingsForm({ user, dict }: SettingsFormProps) {
  const setUser = useAuthStore((s) => s.setUser);
  //   const { setTheme } = useTheme();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      theme: user?.theme,
      gender: user?.gender ?? null,
    },
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      const { data } = await apiClient.put<{
        displayName: string;
        theme: 'auto' | 'light' | 'dark';
        gender: 'male' | 'female' | null;
      }>('users/settings', {
        displayName: values.displayName,
        theme: values.theme,
        gender: values.gender,
      });
      setUser(
        user
          ? {
              ...user,
              displayName: data.displayName,
              theme: data.theme,
              gender: data.gender,
            }
          : null
      );
      toast.success(dict.saved ?? 'Settings saved');
      //   setTheme(values.theme);
    } catch (e: unknown) {
      if (e instanceof ApiClientError) {
        if (e.message) {
          form.setError('displayName', {
            message: e.message,
          });
        } else {
          console.error('Failed to update settings', e);
          toast.error(dict.failedToSave ?? 'Failed to save settings');
        }
      } else {
        console.error('Failed to update settings', e);
        toast.error(dict.failedToSave ?? 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateName = async () => {
    setGenerating(true);
    try {
      const displayName = form.getValues('displayName');
      const email = user?.email;
      if (!email) return;
      const { data } = await apiClient.get(
        `users/generate-user-name?displayName=${encodeURIComponent(
          displayName
        )}&email=${encodeURIComponent(email)}`
      );
      form.setValue('displayName', data.displayName || '');
    } catch (e) {
      console.error('Failed to generate name', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.displayName}</FormLabel>
              <div className="flex gap-2 items-center">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={dict.displayName}
                    autoComplete="off"
                  />
                </FormControl>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={handleGenerateName}
                        disabled={generating}
                      >
                        <Sparkles className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {dict.generateName ?? 'Generate funny name'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.theme}</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-6"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="auto" id="theme-auto" />
                    </FormControl>
                    <FormLabel htmlFor="theme-auto">{dict.themeAuto}</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="light" id="theme-light" />
                    </FormControl>
                    <FormLabel htmlFor="theme-light">
                      {dict.themeLight}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="dark" id="theme-dark" />
                    </FormControl>
                    <FormLabel htmlFor="theme-dark">{dict.themeDark}</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.gender || 'Gender'}</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-28">
                  <SelectValue
                    placeholder={dict.genderPlaceholder || 'Gender'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{dict.male || 'Male'}</SelectItem>
                  <SelectItem value="female">
                    {dict.female || 'Female'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? dict.saving ?? 'Saving...' : dict.save}
        </Button>
      </form>
    </Form>
  );
}
