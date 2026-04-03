"use client";

import { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

const nigerianBanks = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "50211", name: "Kuda Bank" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "50515", name: "Moniepoint" },
  { code: "566", name: "VFD Microfinance Bank" },
  { code: "565", name: "Carbon" },
  { code: "125", name: "Rubies Bank" },
  { code: "104", name: "Parallex Bank" },
  { code: "102", name: "Titan Trust Bank" },
].sort((a, b) => a.name.localeCompare(b.name));

const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "Canada",
  "India",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
].sort();

const timezones = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Paris",
];

const currencies = ["USD", "GBP", "EUR", "NGN", "GHS", "KES", "ZAR"];
const paymentTerms = ["Due on receipt", "Net 7", "Net 14", "Net 30"];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bank connection state
  const [bankForm, setBankForm] = useState({
    account_bank: "",
    account_number: "",
    account_name: "",
  });
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [connectingBank, setConnectingBank] = useState(false);
  const [disconnectingBank, setDisconnectingBank] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  // Password change state
  const [passwordForm, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      setProfile(profile);
      setLoading(false);
    }
  };

  const handleVerifyBank = async () => {
    if (bankForm.account_number.length !== 10) {
      toast.error("Invalid account number", "Account number must be 10 digits");
      return;
    }

    setVerifyingBank(true);

    try {
      const response = await fetch("/api/settings/verify-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: bankForm.account_number,
          account_bank: bankForm.account_bank,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify account");
      }

      setBankForm((prev) => ({ ...prev, account_name: data.account_name }));
      setAccountVerified(true);
      toast.success("Account verified", data.account_name);
    } catch (err: any) {
      toast.error("Verification failed", err.message);
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleConnectBank = async () => {
    setConnectingBank(true);

    try {
      const response = await fetch("/api/settings/connect-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: bankForm.account_number,
          account_bank: bankForm.account_bank,
          account_name: bankForm.account_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect bank account");
      }

      toast.success("Bank account connected", "You can now receive payments");
      fetchProfile();
    } catch (err: any) {
      toast.error("Connection failed", err.message);
    } finally {
      setConnectingBank(false);
    }
  };

  const handleDisconnectBank = async () => {
    setDisconnectingBank(true);

    try {
      const response = await fetch("/api/settings/connect-bank", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect");
      }

      toast.success("Bank account disconnected");
      setBankForm({ account_bank: "", account_number: "", account_name: "" });
      setAccountVerified(false);
      fetchProfile();
    } catch (err: any) {
      toast.error("Failed to disconnect", err.message);
    } finally {
      setDisconnectingBank(false);
      setShowDisconnectDialog(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          business_name: profile.business_name || null,
          phone: profile.phone || null,
          country: profile.country || "Nigeria",
          timezone: profile.timezone || "Africa/Lagos",
          currency: profile.currency || "USD",
          default_payment_terms: profile.default_payment_terms || "Net 14",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Profile saved");
      fetchProfile();
    } catch (err: any) {
      toast.error("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notify_invoice_viewed: profile.notify_invoice_viewed ?? true,
          notify_payment_received: profile.notify_payment_received ?? true,
          notify_contract_signed: profile.notify_contract_signed ?? true,
          notify_invoice_overdue: profile.notify_invoice_overdue ?? true,
          [key]: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notifications");
      }

      toast.success("Notification preference updated");
    } catch (err: any) {
      toast.error("Failed to update", err.message);
      fetchProfile();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error("Failed to update password", err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-12 bg-[#18181b] rounded" />
        <div className="h-64 bg-[#18181b] rounded" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Tabs */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2 mb-6 flex gap-2 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === id
                ? "bg-[#10b981] text-white"
                : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6"
        >
          <h2 className="text-lg font-semibold text-white">Profile Settings</h2>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Full Name *
            </label>
            <input
              value={profile.name || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({ ...prev, name: e.target.value }))
              }
              required
              minLength={2}
              className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Business Name (optional)
            </label>
            <input
              value={profile.business_name || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({
                  ...prev,
                  business_name: e.target.value,
                }))
              }
              className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
              placeholder="Your business or trading name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Phone (optional)
            </label>
            <input
              value={profile.phone || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({ ...prev, phone: e.target.value }))
              }
              type="tel"
              className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
              placeholder="+234..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Country
              </label>
              <select
                value={profile.country || "Nigeria"}
                onChange={(e) =>
                  setProfile((prev: any) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Timezone
              </label>
              <select
                value={profile.timezone || "Africa/Lagos"}
                onChange={(e) =>
                  setProfile((prev: any) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              >
                {timezones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Default Currency
              </label>
              <select
                value={profile.currency || "USD"}
                onChange={(e) =>
                  setProfile((prev: any) => ({
                    ...prev,
                    currency: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Default Payment Terms
              </label>
              <select
                value={profile.default_payment_terms || "Net 14"}
                onChange={(e) =>
                  setProfile((prev: any) => ({
                    ...prev,
                    default_payment_terms: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              >
                {paymentTerms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      )}

      {activeTab === "payment" && (
        <div className="space-y-6">
          {!profile?.flutterwave_subaccount_id ? (
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Connect Your Bank Account
                </h2>
                <p className="text-sm text-[#a1a1aa]">
                  Connect your bank account so clients can pay you directly.
                  Money goes straight to your account — Paidly never holds your
                  funds.
                </p>
              </div>

              {profile?.plan === "free" && (
                <div className="bg-[#3d2e00] border border-[#fbbf24]/30 rounded-lg p-4">
                  <p className="text-sm text-[#fbbf24]">
                    <strong>You're on the Free plan.</strong> Paidly takes a 5%
                    fee on each payment. Upgrade to Pro to keep 100% of every
                    payment.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Bank Name
                  </label>
                  <select
                    value={bankForm.account_bank}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        account_bank: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
                  >
                    <option value="">Select bank</option>
                    {nigerianBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Account Number
                  </label>
                  <input
                    value={bankForm.account_number}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setBankForm((prev) => ({
                        ...prev,
                        account_number: value,
                      }));
                      setAccountVerified(false);
                    }}
                    maxLength={10}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyBank}
                  disabled={
                    verifyingBank ||
                    bankForm.account_number.length !== 10 ||
                    !bankForm.account_bank
                  }
                  className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingBank ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Verify Account"
                  )}
                </button>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Account Name
                  </label>
                  <input
                    value={bankForm.account_name}
                    readOnly
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-[#a1a1aa] cursor-not-allowed"
                    placeholder="Will be auto-filled after verification"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConnectBank}
                  disabled={connectingBank || !accountVerified}
                  className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connectingBank ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Connect Bank Account
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#18181b] border border-[#10b981]/30 rounded-xl p-6 space-y-6">
              <div className="text-center">
                <CheckCircle
                  size={48}
                  className="text-[#10b981] mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-white mb-2">
                  Bank Account Connected
                </h2>
                <p className="text-sm text-[#a1a1aa]">
                  Clients can now pay you directly
                </p>
              </div>

              <div className="bg-[#0f0f0f] border border-[#27272a] rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-[#a1a1aa] mb-1">Bank</p>
                  <p className="text-sm text-white">{profile.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a1a1aa] mb-1">Account Number</p>
                  <p className="text-sm text-white">
                    ****{profile.bank_account_number?.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#a1a1aa] mb-1">Account Name</p>
                  <p className="text-sm text-white">
                    {profile.bank_account_name}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${
                  profile.plan === "pro"
                    ? "bg-[#052e16] border border-[#10b981]/30"
                    : "bg-[#3d2e00] border border-[#fbbf24]/30"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    profile.plan === "pro" ? "text-[#10b981]" : "text-[#fbbf24]"
                  }`}
                >
                  {profile.plan === "pro"
                    ? "0% fee — you keep 100% of every payment"
                    : "5% platform fee per transaction"}
                </p>
              </div>

              <div className="space-y-3">
                {profile.plan === "free" && (
                  <a
                    href="/pricing"
                    className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                  >
                    Upgrade to Pro
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={disconnectingBank}
                  className="w-full py-3 border border-[#ef4444]/30 text-[#ef4444] font-medium rounded-lg hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {disconnectingBank ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Disconnect Account"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">
            Notification Preferences
          </h2>

          {[
            { key: "notify_invoice_viewed", label: "Invoice viewed by client" },
            { key: "notify_payment_received", label: "Payment received" },
            { key: "notify_contract_signed", label: "Contract signed" },
            {
              key: "notify_invoice_overdue",
              label: "Invoice overdue reminder",
            },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0"
            >
              <span className="text-sm text-white">{label}</span>
              <button
                type="button"
                onClick={() => handleToggleNotification(key, !profile?.[key])}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  profile?.[key] ? "bg-[#10b981]" : "bg-[#27272a]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    profile?.[key] ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Change Password */}
          <form
            onSubmit={handleChangePassword}
            className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-white">
              Change Password
            </h2>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {changingPassword ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          {/* Danger Zone */}
          <div className="bg-[#18181b] border-2 border-[#ef4444]/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#ef4444] mb-4">
              Danger Zone
            </h2>
            <p className="text-sm text-[#a1a1aa] mb-4">
              This will permanently delete your account and all data.
            </p>
            <button
              type="button"
              className="px-6 py-2 border border-[#ef4444] text-[#ef4444] font-medium rounded-lg hover:bg-[#ef4444]/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        isOpen={showDisconnectDialog}
        onClose={() => setShowDisconnectDialog(false)}
        onConfirm={handleDisconnectBank}
        title="Disconnect Bank Account"
        message="Are you sure? Clients won't be able to pay your invoices until you reconnect a bank account."
        confirmLabel="Disconnect"
        cancelLabel="Keep Connected"
        variant="danger"
        loading={disconnectingBank}
      />
    </div>
  );
}
