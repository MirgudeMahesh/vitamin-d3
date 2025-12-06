// ============================================================
// CREATECAMPINLINE.TSX - Territory-Based Doctor Filtering
// ============================================================
import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Phone, AlertCircle } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  territory: string | null;
  phone: string;
  whatsapp_number: string | null;
}

interface Props {
  onSuccess: (campId: string) => void;
}

interface User {
  id: string;
  email: string;
  imacx_id: string;
  loginTime: string;
  territory?: string; // ✅ Added territory
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

const CreateCampInline = memo(({ onSuccess }: Props) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [campDate, setCampDate] = useState("");
  const [doctorWhatsApp, setDoctorWhatsApp] = useState<string>("");
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [userTerritory, setUserTerritory] = useState<string | null>(null);
  const [territoryError, setTerritoryError] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ Get user from localStorage instead of Supabase Auth
  const getCurrentUser = useCallback((): User | null => {
    try {
      const storedUser = localStorage.getItem("vitaminDUser");
      if (!storedUser) return null;
      return JSON.parse(storedUser);
    } catch (err) {
      console.error("Error parsing user data:", err);
      return null;
    }
  }, []);

  // ✅ Fetch user's territory from database
  const fetchUserTerritory = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setTerritoryError("User not found. Please log in again.");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("territory")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;

      setUserTerritory(data?.territory || null);

      if (!data?.territory) {
        setTerritoryError(
          "Your territory is not set. Please contact administrator."
        );
      }
    } catch (err: any) {
      console.error("Error fetching user territory:", err);
      setTerritoryError(
        err?.message || "Failed to fetch your territory information"
      );
      toast({
        title: "Territory Error",
        description:
          err?.message || "Failed to fetch your territory information",
        variant: "destructive",
      });
    }
  }, [getCurrentUser, toast]);

  // ✅ Fetch doctors filtered by user's territory
  const fetchDoctors = useCallback(async () => {
    if (!userTerritory) {
      setLoadingDoctors(false);
      return;
    }

    try {
      // 🔑 KEY CHANGE: Filter doctors by territory matching user's territory
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_selected_by_marketing", true)
        .eq("Territory", userTerritory) // ✅ Filter by user's territory
        .order("name");

      if (error) throw error;

      if (!data || data.length === 0) {
        setTerritoryError(
          `No doctors found in your territory (${userTerritory}).`
        );
      } else {
        setTerritoryError(null);
      }

      setDoctors(data || []);
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      toast({
        title: "Error fetching doctors",
        description: err?.message || "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  }, [userTerritory, toast]);

  // ✅ Fetch user territory on mount
  useEffect(() => {
    fetchUserTerritory();
  }, [fetchUserTerritory]);

  // ✅ Fetch doctors when territory is loaded
  useEffect(() => {
    if (userTerritory) {
      fetchDoctors();
    }
  }, [userTerritory, fetchDoctors]);

  // Handle doctor selection
  const handleDoctorSelect = useCallback(
    (id: string) => {
      setSelectedDoctorId(id);
      const doc = doctors.find((d) => d.id === id) || null;
      setSelectedDoctor(doc);
      setDoctorWhatsApp(doc?.whatsapp_number || doc?.phone || ""); // auto-fill WhatsApp
    },
    [doctors]
  );

  // Validate file
  const validateFile = useCallback((file: File): boolean => {
    setFileError(null);

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError("Only JPG, PNG, and PDF files are allowed");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 5MB");
      return false;
    }

    return true;
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file && validateFile(file)) {
        setConsentFile(file);
      } else {
        setConsentFile(null);
        e.target.value = ""; // Reset input
      }
    },
    [validateFile]
  );

  // Upload consent form - private & linked to camp_id
  const uploadConsentForm = useCallback(
    async (file: File, campId: string): Promise<string> => {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${campId}.${fileExt}`; // store with camp_id
        const filePath = `consents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("consent_forms")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true, // overwrite if reuploaded
          });

        if (uploadError) throw uploadError;

        // Save file path only (not URL)
        return filePath;
      } catch (err: any) {
        console.error("File upload error:", err);
        throw new Error(err?.message || "Failed to upload consent form");
      }
    },
    []
  );

  // Determine camp status
  const determineCampStatus = useCallback((campDate: string): string => {
    const today = new Date();
    const selectedDate = new Date(campDate);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today ? "scheduled" : "active";
  }, []);

  // Send WhatsApp message
  const sendWhatsAppMessage = useCallback(
    (doctor: Doctor, campDate: string) => {
      const phone = doctor.whatsapp_number || doctor.phone;
      if (!phone) return;

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const message = `
Dear Dr. ${doctor?.name || ""},

Thank you for your consent to conduct Vitamin D Risk Assessment Camp at your clinic on ${new Date(
        campDate
      ).toLocaleDateString()}.

We will initiate screening patients for their risk of Vitamin D deficiency shortly.
Once the camp concludes, we'll share a brief summary report highlighting the number of patients screened and key findings.

Thank you for partnering with Pulse Pharmaceuticals in this mission to make India Vitamin D deficiency-free.

Team Pulse Pharmaceuticals
Your Partner in Vitamin D Management
`.trim();

      window.open(
        `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    },
    []
  );

  // Create camp
  const handleCreateCamp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedDoctorId || !campDate) {
        toast({
          title: "Missing information",
          description: "Please select a doctor and camp date.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        // ✅ Get current user from localStorage
        const currentUser = getCurrentUser();
        if (!currentUser) {
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
            variant: "destructive",
          });
          return;
        }

        // ✅ Update doctor's WhatsApp number before creating camp
        if (doctorWhatsApp) {
          const { error: updateError } = await supabase
            .from("doctors")
            .update({ whatsapp_number: doctorWhatsApp })
            .eq("id", selectedDoctorId);

          if (updateError) {
            console.warn(
              "Failed to update doctor's WhatsApp number:",
              updateError.message
            );
          }
        }

        // ✅ Step 1: Determine initial camp status
        const initialStatus = determineCampStatus(campDate);

        // ✅ Step 2: Create camp first (without consent)
        const { data: camp, error: campError } = await supabase
          .from("camps")
          .insert({
            user_id: currentUser.id, // ✅ Using user ID from localStorage
            doctor_id: selectedDoctorId,
            camp_date: campDate,
            status: initialStatus,
            total_patients: 0,
          })
          .select()
          .single();

        if (campError) throw campError;

        // ✅ Step 3: If consent file exists, upload it with camp_id
        if (consentFile) {
          const filePath = await uploadConsentForm(consentFile, camp.id);

          const { error: updateError } = await supabase
            .from("camps")
            .update({ consent_form_url: filePath })
            .eq("id", camp.id);

          if (updateError) throw updateError;
        }

        // ✅ Step 4: Send WhatsApp message
        if (selectedDoctor) {
          const updatedDoctor = {
            ...selectedDoctor,
            whatsapp_number: doctorWhatsApp,
          };
          sendWhatsAppMessage(updatedDoctor, campDate);
        }

        // ✅ Step 5: Notify user
        toast({
          title: "Camp created successfully!",
          description:
            initialStatus === "scheduled"
              ? "Camp scheduled successfully."
              : "Camp created and active! Redirecting to patient registration...",
        });

        onSuccess(camp.id);
      } catch (err: any) {
        console.error("Camp creation error:", err);
        toast({
          title: "Error creating camp",
          description: err?.message || "Failed to create camp",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      selectedDoctorId,
      campDate,
      consentFile,
      selectedDoctor,
      doctorWhatsApp,
      determineCampStatus,
      uploadConsentForm,
      sendWhatsAppMessage,
      getCurrentUser,
      onSuccess,
      toast,
    ]
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleCreateCamp} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" /> Camp Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ Territory Display */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Your Territory:{" "}
                  <span className="font-bold">
                    {userTerritory || "Loading..."}
                  </span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can only create camps with doctors assigned to your territory.
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Territory Error Display */}
          {territoryError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{territoryError}</p>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <Label htmlFor="doctor-select">
              Select Doctor <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedDoctorId}
              onValueChange={handleDoctorSelect}
              disabled={loadingDoctors || !userTerritory || doctors.length === 0}
            >
              <SelectTrigger id="doctor-select">
                <SelectValue
                  placeholder={
                    loadingDoctors
                      ? "Loading doctors..."
                      : doctors.length === 0
                        ? "No doctors in your territory"
                        : "Choose a doctor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name} • {doctor.clinic_name}, {doctor.city} •{" "}
                    {doctor.territory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} available
              in your territory
            </p>
          </div>

          {/* Auto-filled fields */}
          {selectedDoctor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Specialty</Label>
                <Input value={selectedDoctor.specialty || "N/A"} readOnly />
              </div>
              <div>
                <Label>Territory</Label>
                <Input value={selectedDoctor.Territory || "N/A"} readOnly />
              </div>
              <div>
                <Label>Doctor Mobile</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={selectedDoctor.phone || "N/A"}
                    readOnly
                  />
                </div>
              </div>
              <div>
                <Label>Doctor WhatsApp Number (editable)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={doctorWhatsApp}
                    onChange={(e) => setDoctorWhatsApp(e.target.value)}
                    placeholder="Enter WhatsApp number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Clinic Name</Label>
                <Input value={selectedDoctor.clinic_name || "N/A"} readOnly />
              </div>
              <div>
                <Label>Clinic Address</Label>
                <Input
                  value={selectedDoctor.clinic_address || "N/A"}
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <Label>City</Label>
                <Input value={selectedDoctor.city || "N/A"} readOnly />
              </div>
            </div>
          )}

          {/* Camp Date */}
          <div>
            <Label htmlFor="camp-date">
              Camp Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="camp-date"
              type="date"
              value={campDate}
              onChange={(e) => setCampDate(e.target.value)}
              required
              min={today}
            />
          </div>

          {/* Consent Form */}
          <div>
            <Label htmlFor="consent-file">
              Upload Consent Form
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="consent-file"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            {fileError && (
              <p className="text-sm text-destructive mt-1">{fileError}</p>
            )}
            {consentFile && !fileError && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {consentFile.name} (
                {(consentFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                loading ||
                !selectedDoctorId ||
                !campDate ||
                consentFile === null ||
                !userTerritory
              }
              className="bg-gradient-to-r from-primary to-medical-teal hover:opacity-90"
            >
              {loading ? "Creating..." : "Create Camp"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
});

CreateCampInline.displayName = "CreateCampInline";

export default CreateCampInline;
