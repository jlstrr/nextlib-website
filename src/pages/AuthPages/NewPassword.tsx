import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import NewPasswordForm from "../../components/auth/NewPasswordForm";

export default function NewPassword() {
  return (
    <>
      <PageMeta
        title="Forgot Password | iReserve System"
        description="This is the forgot password page for iReserve System, where users can securely reset their password to regain access to their account."
      />
      <AuthLayout>
        <NewPasswordForm />
      </AuthLayout>
    </>
  );
}
