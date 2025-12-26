import { DoctorAddition } from "./DoctorAddition";

function DoctorAdditionPage() {
  const handleSuccess = () => {
    console.log("Doctor added, refresh list...");
    // e.g. you can navigate back or refresh doctors list here
  };

  return (
    <div className="p-6">
      <DoctorAddition onSuccess={handleSuccess} />
    </div>
  );
}

export default DoctorAdditionPage;
