import * as React from "react";
import { ResetPasswordLinkEmail } from "./ResetPasswordLinkEmail";

export default function ResetPasswordLinkEmailPreview() {
  return (
    <ResetPasswordLinkEmail
      name="Nguyen Van A"
      resetLink="https://holyann.com/reset-password?token=demo-token"
      expiresHours={1}
    />
  );
}
