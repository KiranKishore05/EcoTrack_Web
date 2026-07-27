'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/eco-dashboard';
import { supabase } from "@/lib/supabase";
import {
    User,
    Mail,
    MapPin,
    Calendar,
    Pencil,
    Leaf,
    Activity,
    Flame,
    Trophy,
    Target,
    Award,
    Zap,
    Bike,
    CheckCircle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

export default function ProfilePage() {
    const { profile, user } = useAuth();
    const [activityCount, setActivityCount] = useState(0);
    const [co2Saved, setCo2Saved] = useState(0);
    const [achievementCount, setAchievementCount] = useState(0);
    const [budget, setBudget] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayName] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!user) return;

        const loadDashboard = async () => {
            setLoading(true);

            try {
                const data = await getDashboardStats(user.id);
                setStats(data);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [user]);
    const handleSaveProfile = async () => {
        if (!user) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                location: location,
                bio: bio,
                website: website,
            })
            .eq("id", user.id);

        if (error) {
            console.error(error);
            alert("Failed to update profile.");
            return;
        }

        alert("Profile updated successfully!");
        setOpen(false);

        window.location.reload();
    };
    useEffect(() => {
        if (!profile) return;

        setDisplayName(profile.display_name || "");
        setLocation(profile.location || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
    }, [profile]);
    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        My Profile
                    </h1>

                    <p className="text-muted-foreground mt-2">
                        Manage your EcoTrack account information and sustainability journey.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit Profile
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">

                            <Input
                                placeholder="Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />

                            <Input
                                placeholder="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />

                            <Input
                                placeholder="Bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />

                            <Input
                                placeholder="Website"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />

                            <Button
                                className="w-full"
                                onClick={handleSaveProfile}
                            >
                                Save Changes
                            </Button>

                        </div>
                    </DialogContent>
                </Dialog>

            </div>

            {/* Eco Score Card */}
            <Card className="p-6 rounded-2xl">

                <div className="flex flex-col md:flex-row justify-between items-center">

                    <div>
                        <h2 className="text-2xl font-bold">
                            {profile?.display_name || 'User'}
                        </h2>

                        <p className="text-muted-foreground">
                            Sustainability Champion
                        </p>
                    </div>

                    <div className="text-center md:text-right mt-4 md:mt-0">

                        <p className="text-sm text-muted-foreground">
                            Eco Level
                        </p>

                        <h2 className="text-3xl font-bold text-green-600">
                            🌱 Level {stats?.level ?? 1}
                        </h2>

                    </div>

                </div>

                <div className="mt-6">

                    <div className="flex justify-between text-sm">
                        <span>Eco Score</span>
                        <span className="font-semibold">
                            {stats?.sustainabilityIndex ?? 0} / 100
                        </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-3 mt-3">

                        <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${stats?.sustainabilityIndex ?? 0}%` }}
                        />

                    </div>

                </div>

            </Card>

            {/* Personal Information */}
            <Card className="p-6 rounded-2xl">

                <h2 className="text-xl font-semibold mb-6">
                    Personal Information
                </h2>

                <div className="grid gap-6 md:grid-cols-2">

                    <div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            Display Name
                        </label>

                        <div className="mt-2 rounded-lg border p-3">
                            {profile?.display_name || 'Not Available'}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>

                        <div className="mt-2 rounded-lg border p-3">
                            {user?.email || 'Not Available'}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            Location
                        </label>

                        <div className="mt-2 rounded-lg border p-3">
                            {profile?.location || 'Not Available'}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Member Since
                        </label>

                        <div className="mt-2 rounded-lg border p-3">
                            {profile?.created_at
                                ? new Date(profile.created_at).toLocaleDateString()
                                : 'Not Available'}
                        </div>
                    </div>

                </div>

            </Card>
            {/* Sustainability Statistics */}
            <Card className="p-6 rounded-2xl">

                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <Leaf className="w-5 h-5 text-green-500" />
                    Sustainability Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Carbon Score
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats?.sustainabilityIndex ?? 0}
                                </h3>
                            </div>

                            <Leaf className="w-8 h-8 text-green-500" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Activities Logged
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats?.activityCount ?? 0}
                                </h3>
                            </div>

                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    CO₂ Saved
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats ? `${stats.totalCO2.toFixed(2)} kg` : "0.00 kg"}
                                </h3>
                            </div>

                            <Leaf className="w-8 h-8 text-emerald-500" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Current Streak
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats?.currentStreak ?? 0} Days
                                </h3>
                            </div>

                            <Flame className="w-8 h-8 text-orange-500" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Achievements
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats?.achievementCount ?? 0}
                                </h3>
                            </div>

                            <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Carbon Budget
                                </p>

                                <h3 className="text-2xl font-bold mt-2">
                                    {stats?.budgetKg ?? 0} kg
                                </h3>
                            </div>

                            <Target className="w-8 h-8 text-purple-500" />
                        </div>
                    </Card>

                </div>

            </Card>
            {/* Latest Achievements */}

            <Card className="p-6 rounded-2xl">

                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Latest Achievements
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="flex items-center gap-4 rounded-xl border p-4 hover:border-green-500 transition">

                        <div className="bg-green-500/20 p-3 rounded-full">
                            <Award className="w-6 h-6 text-green-500" />
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                Eco Warrior
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Logged 100 eco-friendly activities.
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-4 rounded-xl border p-4 hover:border-emerald-500 transition">

                        <div className="bg-emerald-500/20 p-3 rounded-full">
                            <Leaf className="w-6 h-6 text-emerald-500" />
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                Green Starter
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Completed your first sustainability challenge.
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-4 rounded-xl border p-4 hover:border-yellow-500 transition">

                        <div className="bg-yellow-500/20 p-3 rounded-full">
                            <Zap className="w-6 h-6 text-yellow-500" />
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                Energy Saver
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Reduced electricity consumption.
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-4 rounded-xl border p-4 hover:border-blue-500 transition">

                        <div className="bg-blue-500/20 p-3 rounded-full">
                            <Bike className="w-6 h-6 text-blue-500" />
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                Bike Champion
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Used eco-friendly transportation regularly.
                            </p>
                        </div>

                    </div>

                </div>

            </Card>
            {/* Sustainability Goals */}

            <Card className="p-6 rounded-2xl">

                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-purple-500" />
                    Sustainability Goals
                </h2>

                <div className="space-y-6">

                    <div>

                        <div className="flex justify-between mb-2">
                            <span className="font-medium">
                                Goal Progress
                            </span>

                            <span className="text-green-500 font-semibold">
                                68%
                            </span>
                        </div>

                        <div className="w-full bg-muted rounded-full h-3">

                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full"
                                style={{ width: "68%" }}
                            />

                        </div>

                    </div>

                    <div className="grid md:grid-cols-2 gap-4">

                        <div className="rounded-xl border p-4">

                            <div className="flex items-center gap-3">

                                <CheckCircle className="text-green-500 w-6 h-6" />

                                <div>

                                    <h3 className="font-semibold">
                                        Reduce Carbon Footprint
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        Complete 100 eco activities
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="rounded-xl border p-4">

                            <div className="flex items-center gap-3">

                                <CheckCircle className="text-blue-500 w-6 h-6" />

                                <div>

                                    <h3 className="font-semibold">
                                        Save Electricity
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        Reduce energy usage by 20%
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </Card>
        </div>
    );
}