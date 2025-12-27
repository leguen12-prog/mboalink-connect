import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, Building, Bell, Shield, Palette, 
  Globe, Save, Mail, Phone, MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    department: '',
    timezone: 'Africa/Douala'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    sms_alerts: false,
    critical_only: false,
    daily_digest: true
  });
  const [companySettings, setCompanySettings] = useState({
    company_name: 'MBOALINK',
    support_email: 'support@mboalink.cm',
    support_phone: '+237 6XX XXX XXX',
    address: 'Douala, Cameroon',
    currency: 'XAF',
    timezone: 'Africa/Douala'
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setProfileData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        department: userData.department || '',
        timezone: userData.timezone || 'Africa/Douala'
      });
    } catch (e) {
      console.log('User not logged in');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe(profileData);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account and system preferences"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-800/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="data-[state=active]:bg-slate-700">
            <Building className="w-4 h-4 mr-2" /> Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>
            
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-2xl">
                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="mt-4 border-slate-700 text-sm">
                  Change Photo
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Full Name</Label>
                    <Input 
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Email</Label>
                    <Input 
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-800/50 border-slate-700 text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <Input 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Department</Label>
                    <Select value={profileData.department} onValueChange={(val) => setProfileData({...profileData, department: val})}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="noc">NOC</SelectItem>
                        <SelectItem value="field_ops">Field Operations</SelectItem>
                        <SelectItem value="customer_support">Customer Support</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Role</Label>
                    <Input 
                      value={user?.role || 'user'}
                      disabled
                      className="bg-slate-800/50 border-slate-700 text-slate-400 capitalize"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Timezone</Label>
                    <Select value={profileData.timezone} onValueChange={(val) => setProfileData({...profileData, timezone: val})}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="Africa/Douala">Africa/Douala (WAT)</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6">Company Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Company Name</Label>
                <Input 
                  value={companySettings.company_name}
                  onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Support Email</Label>
                <Input 
                  value={companySettings.support_email}
                  onChange={(e) => setCompanySettings({...companySettings, support_email: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Support Phone</Label>
                <Input 
                  value={companySettings.support_phone}
                  onChange={(e) => setCompanySettings({...companySettings, support_phone: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Currency</Label>
                <Select value={companySettings.currency} onValueChange={(val) => setCompanySettings({...companySettings, currency: val})}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="XAF">XAF (CFA Franc)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-400">Address</Label>
                <Textarea 
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <div>
                  <p className="font-medium text-white">Email Alerts</p>
                  <p className="text-sm text-slate-400">Receive alert notifications via email</p>
                </div>
                <Switch 
                  checked={notificationSettings.email_alerts}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email_alerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <div>
                  <p className="font-medium text-white">SMS Alerts</p>
                  <p className="text-sm text-slate-400">Receive critical alerts via SMS</p>
                </div>
                <Switch 
                  checked={notificationSettings.sms_alerts}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sms_alerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <div>
                  <p className="font-medium text-white">Critical Alerts Only</p>
                  <p className="text-sm text-slate-400">Only receive notifications for critical issues</p>
                </div>
                <Switch 
                  checked={notificationSettings.critical_only}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, critical_only: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <div>
                  <p className="font-medium text-white">Daily Digest</p>
                  <p className="text-sm text-slate-400">Receive a daily summary of all activities</p>
                </div>
                <Switch 
                  checked={notificationSettings.daily_digest}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, daily_digest: checked})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900">
                <Save className="w-4 h-4 mr-2" /> Save Preferences
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6">Security Settings</h2>
            
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-800/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-400">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" className="border-slate-700">
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-white">Change Password</p>
                    <p className="text-sm text-slate-400">Update your account password</p>
                  </div>
                  <Button variant="outline" className="border-slate-700">
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30">
                <p className="font-medium text-white mb-4">Active Sessions</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-white">Current Session</p>
                        <p className="text-xs text-slate-500">Chrome on Windows • Douala, Cameroon</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400">Active now</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}