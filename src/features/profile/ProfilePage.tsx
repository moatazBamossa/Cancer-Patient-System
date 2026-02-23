import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth.service';
import { FormField } from '../../components/ui/FormField';
import { getInitials } from '../../lib/utils';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, role, updateUser } = useAuthStore();

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => authService.updateProfile(user!.id, data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (!user || !role) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
               style={{ background: 'var(--accent-gradient)' }}>
            {getInitials(user.full_name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{user.full_name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{role.name} • {user.username}</p>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <FormField name="full_name" label="Full Name" required />
            <FormField name="email" label="Email" type="email" required />
            <FormField name="phone" label="Phone" type="tel" required />
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={updateMutation.isPending}
                className="gradient-btn px-6 py-2.5 text-sm">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Account Details</h3>
        {[
          ['Username', user.username],
          ['Role', role.name],
          ['Account Status', user.is_active ? 'Active' : 'Inactive'],
          ['Member Since', new Date(user.created_at).toLocaleDateString()],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between py-2 text-sm border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
