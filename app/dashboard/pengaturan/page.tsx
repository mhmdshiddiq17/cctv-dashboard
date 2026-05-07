'use client';

import { useState } from 'react';
import { Save, Lock, Bell, Eye, Monitor, ToggleRight, ToggleLeft, ChevronRight } from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function SettingToggle({ value, onChange }: Readonly<{ value: boolean; onChange: (val: boolean) => void }>) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="ml-auto text-gray-400 hover:text-white transition"
    >
      {value ? (
        <ToggleRight size={20} className="text-green-500" />
      ) : (
        <ToggleLeft size={20} />
      )}
    </button>
  );
}

export default function PengaturanPage() {
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    cctvOfflineAlert: true,
    cctvMaintenanceAlert: true,
    recordingStorageAlert: false,
    dailyReport: true,

    // Display Settings
    darkMode: true,
    autoRefresh: true,
    refreshInterval: '5',
    timezone: 'Asia/Jakarta',

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    changePassword: false,

    // System Settings
    maintenanceMode: false,
    backupEnabled: true,
    backupInterval: 'daily',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="p-5 w-full h-full overflow-auto">
      {/* Header */}
      <div className="mb-8 top-0 bg-gray-950 py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Pengaturan</h1>
        <p className="text-gray-400 text-sm mb-4">Kelola preferensi dan konfigurasi sistem</p>
        
        {saved && (
          <div className="px-4 py-2 bg-green-950 border border-green-700 rounded-lg text-green-400 text-sm">
            ✓ Pengaturan berhasil disimpan
          </div>
        )}
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Notification Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-800">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-red-500" />
              <div>
                <h2 className="text-lg font-semibold text-white">Notifikasi</h2>
                <p className="text-gray-400 text-sm">Kelola pengaturan pemberitahuan dan alert</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-400 text-sm">Terima notifikasi melalui email</p>
              </div>
              <SettingToggle value={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
            </div>
            <div className="border-t border-gray-800" />
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">SMS Notifications</p>
                <p className="text-gray-400 text-sm">Terima notifikasi melalui SMS</p>
              </div>
              <SettingToggle value={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">CCTV Offline Alert</p>
                <p className="text-gray-400 text-sm">Notifikasi ketika CCTV offline</p>
              </div>
              <SettingToggle value={settings.cctvOfflineAlert} onChange={() => handleToggle('cctvOfflineAlert')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Maintenance Alert</p>
                <p className="text-gray-400 text-sm">Notifikasi status maintenance CCTV</p>
              </div>
              <SettingToggle value={settings.cctvMaintenanceAlert} onChange={() => handleToggle('cctvMaintenanceAlert')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Daily Report</p>
                <p className="text-gray-400 text-sm">Terima laporan harian via email</p>
              </div>
              <SettingToggle value={settings.dailyReport} onChange={() => handleToggle('dailyReport')} />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-800">
            <div className="flex items-center gap-3">
              <Monitor size={20} className="text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-white">Tampilan</h2>
                <p className="text-gray-400 text-sm">Pengaturan antarmuka dan tampilan</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-400 text-sm">Gunakan mode gelap</p>
              </div>
              <SettingToggle value={settings.darkMode} onChange={() => handleToggle('darkMode')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Auto Refresh</p>
                <p className="text-gray-400 text-sm">Segarkan data secara otomatis</p>
              </div>
              <SettingToggle value={settings.autoRefresh} onChange={() => handleToggle('autoRefresh')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="py-3">
              <div className="mb-2">
                <p className="text-white font-medium">Interval Refresh</p>
                <p className="text-gray-400 text-sm">Berapa detik untuk segarkan data</p>
              </div>
              <select
                value={settings.refreshInterval}
                onChange={(e) => handleChange('refreshInterval', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600"
              >
                <option value="5">5 detik</option>
                <option value="10">10 detik</option>
                <option value="30">30 detik</option>
                <option value="60">1 menit</option>
              </select>
            </div>
            <div className="border-t border-gray-800" />

            <div className="py-3">
              <div className="mb-2">
                <p className="text-white font-medium">Timezone</p>
                <p className="text-gray-400 text-sm">Zona waktu untuk ditampilkan</p>
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-800">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-yellow-500" />
              <div>
                <h2 className="text-lg font-semibold text-white">Keamanan</h2>
                <p className="text-gray-400 text-sm">Kelola preferensi keamanan akun</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-gray-400 text-sm">Tambahkan lapisan keamanan ekstra</p>
              </div>
              <SettingToggle value={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="py-3">
              <div className="mb-2">
                <p className="text-white font-medium">Session Timeout</p>
                <p className="text-gray-400 text-sm">Logout otomatis setelah tidak aktif (menit)</p>
              </div>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="border-t border-gray-800" />

            <button className="w-full py-3 text-left hover:bg-gray-800 rounded transition flex items-center justify-between group">
              <div>
                <p className="text-white font-medium group-hover:text-red-500 transition">Ubah Password</p>
                <p className="text-gray-400 text-sm">Perbarui password akun Anda</p>
              </div>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-red-500 transition" />
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-800">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-purple-500" />
              <div>
                <h2 className="text-lg font-semibold text-white">Sistem</h2>
                <p className="text-gray-400 text-sm">Pengaturan sistem dan backup</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-gray-400 text-sm">Aktifkan mode maintenance</p>
              </div>
              <SettingToggle value={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Backup Otomatis</p>
                <p className="text-gray-400 text-sm">Backup database secara otomatis</p>
              </div>
              <SettingToggle value={settings.backupEnabled} onChange={() => handleToggle('backupEnabled')} />
            </div>
            <div className="border-t border-gray-800" />

            <div className="py-3">
              <div className="mb-2">
                <p className="text-white font-medium">Backup Interval</p>
                <p className="text-gray-400 text-sm">Frekuensi backup otomatis</p>
              </div>
              <select
                value={settings.backupInterval}
                onChange={(e) => handleChange('backupInterval', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600"
              >
                <option value="hourly">Per Jam</option>
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            <Save size={18} /> Simpan Pengaturan
          </button>
          <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
