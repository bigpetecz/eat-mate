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
import apiClient from '../apiClient';
import { User } from '../auth/authStore';

const settingsSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  theme: z.enum(['auto', 'light', 'dark']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  //   const { setTheme } = useTheme();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user.displayName || '',
      theme: user.theme,
    },
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      await apiClient.put('users/settings', {
        displayName: values.displayName,
        theme: values.theme,
      });
      //   setTheme(values.theme);
    } catch (e: any) {
      if (e?.response?.data?.message) {
        form.setError('displayName', { message: e.response.data.message });
      } else {
        console.error('Failed to update settings', e);
      }
    } finally {
      setSaving(false);
    }
    window.location.reload();
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateName = async () => {
    setGenerating(true);
    try {
      const { data } = await apiClient.get('users/generate-user-name');
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
              <FormLabel>Display Name</FormLabel>
              <div className="flex gap-2 items-center">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your display name"
                    autoComplete="off"
                  />
                </FormControl>
                <TooltipProvider>
                  <Tooltip open>
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
                      Generate funny name
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
              <FormLabel>Theme</FormLabel>
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
                    <FormLabel htmlFor="theme-auto">Auto</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="light" id="theme-light" />
                    </FormControl>
                    <FormLabel htmlFor="theme-light">Light</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="dark" id="theme-dark" />
                    </FormControl>
                    <FormLabel htmlFor="theme-dark">Dark</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
