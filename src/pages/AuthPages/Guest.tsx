import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import GuestForm from "../../components/auth/GuestForm";

export default function Guest() {
  return (
    <>
      <PageMeta
        title="Guest Access | NextLib System"
        description="Request guest access to NextLib System facilities. Fill out the form to register as a guest user."
      />
      <AuthLayout>
        <GuestForm />
      </AuthLayout>
    </>
  );
}