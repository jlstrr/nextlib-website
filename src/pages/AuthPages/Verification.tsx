import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import VerificationForm from "../../components/auth/VerificationForm";

export default function Verification() {
  return (
    <>
      <PageMeta
        title="Verification | iReserve System"
        description="This is the verification page for iReserve System, where users can verify their accounts after registration or password reset."
      />
      <AuthLayout>
        <VerificationForm />
      </AuthLayout>
    </>
  );
}
