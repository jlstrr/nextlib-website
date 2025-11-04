import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Login | NextLib System"
        description="This is the login page for NextLib System, where users can securely sign in to access their reservations and account settings."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
