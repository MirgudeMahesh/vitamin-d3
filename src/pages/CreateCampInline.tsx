// ============================================================
// CREATECAMPINLINE.TSX - Production Ready (No Territory Dependency)
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
import { Calendar, Phone, CheckCircle2 } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
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
  const { toast } = useToast();

  // ✅ Fetch all doctors (no territory filtering)
  const fetchDoctors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_selected_by_marketing", true)
        .order("name");

      if (error) throw error;
      setDoctors(data || []);
    } catch (err: any) {
      toast({
        title: "Error fetching doctors",
        description: err?.message || "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

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

  // ✅ Get user from localStorage
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
      <Card className="border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Camp Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor-select" className="text-sm font-medium text-foreground">
              Select Doctor <span className="text-destructive font-bold">*</span>
            </Label>
            <Select
              value={selectedDoctorId}
              onValueChange={handleDoctorSelect}
              disabled={loadingDoctors}
            >
              <SelectTrigger
                id="doctor-select"
                className="w-full border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              >
                <SelectValue
                  placeholder={
                    loadingDoctors ? "Loading doctors..." : "Choose a doctor"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <span className="font-medium">{doctor.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        • {doctor.clinic_name}, {doctor.city}
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No doctors available
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} available
            </p>
          </div>

          {/* Auto-filled Doctor Details */}
          {selectedDoctor && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="border-t border-border/40 pt-4">
                <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Selected Doctor Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Doctor Name
                    </Label>
                    <Input
                      value={selectedDoctor.name || "N/A"}
                      readOnly
                      className="bg-muted/50 border-border/40 text-foreground font-medium cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Specialty
                    </Label>
                    <Input
                      value={selectedDoctor.specialty || "N/A"}
                      readOnly
                      className="bg-muted/50 border-border/40 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Clinic Name
                    </Label>
                    <Input
                      value={selectedDoctor.clinic_name || "N/A"}
                      readOnly
                      className="bg-muted/50 border-border/40 text-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      City
                    </Label>
                    <Input
                      value={selectedDoctor.city || "N/A"}
                      readOnly
                      className="bg-muted/50 border-border/40 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Clinic Address
                    </Label>
                    <Input
                      value={selectedDoctor.clinic_address || "N/A"}
                      readOnly
                      className="bg-muted/50 border-border/40 text-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Doctor Mobile
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        value={selectedDoctor.phone || "N/A"}
                        readOnly
                        className="pl-10 bg-muted/50 border-border/40 text-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Row 4 - Editable WhatsApp */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label
                      htmlFor="whatsapp"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Doctor WhatsApp Number{" "}
                      <span className="text-destructive font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={doctorWhatsApp}
                        onChange={(e) => setDoctorWhatsApp(e.target.value)}
                        placeholder="Enter WhatsApp number"
                        className="pl-10 border-input bg-background text-foreground placeholder:text-muted-foreground/50 hover:bg-accent/50 focus:ring-2 focus:ring-primary transition-colors duration-150"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +91XXXXXXXXXX)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camp Date */}
          <div className="space-y-2">
            <Label htmlFor="camp-date" className="text-sm font-medium text-foreground">
              Camp Date <span className="text-destructive font-bold">*</span>
            </Label>
            <Input
              id="camp-date"
              type="date"
              value={campDate}
              onChange={(e) => setCampDate(e.target.value)}
              required
              min={today}
              className="border-input bg-background text-foreground hover:bg-accent/50 focus:ring-2 focus:ring-primary transition-colors duration-150"
            />
            <p className="text-xs text-muted-foreground">
              Select a date for the camp
            </p>
          </div>

          {/* Consent Form Upload */}
          <div className="space-y-2">
            <Label htmlFor="consent-file" className="text-sm font-medium text-foreground">
              Upload Consent Form
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="relative">
              <Input
                id="consent-file"
                type="file"
                accept="image/jpeg,image/png,image/jpg,.pdf"
                onChange={handleFileChange}
                className="border-input bg-background text-foreground cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors duration-150"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPG, PNG, PDF (Max 5MB)
            </p>
            {fileError && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ {fileError}
                </p>
              </div>
            )}
            {consentFile && !fileError && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      {consentFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {(consentFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2 border-t border-border/40">
            <Button
              type="submit"
              disabled={
                loading || !selectedDoctorId || !campDate || consentFile === null
              }
              className="bg-gradient-to-r from-primary to-medical-teal hover:opacity-90 text-primary-foreground font-semibold px-8 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating Camp...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Camp
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
});

CreateCampInline.displayName = "CreateCampInline";

export default CreateCampInline;
