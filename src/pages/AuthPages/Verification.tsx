import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import VerificationForm from "../../components/auth/VerificationForm";

export default function Verification() {
  return (
    <>
      <PageMeta
        title="Verification | NextLib System"
        description="This is the verification page for NextLib System, where users can verify their accounts after registration or password reset."
      />
      <AuthLayout>
        <VerificationForm />
      </AuthLayout>
    </>
  );
}
