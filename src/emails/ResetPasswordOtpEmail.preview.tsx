import * as React from "react";
import { ResetPasswordOtpEmail } from "./ResetPasswordOtpEmail";

export default function ResetPasswordOtpEmailPreview() {
  return (
    <ResetPasswordOtpEmail
      name="Nguyen Van A"
      otp="123456"
      expiresMinutes={10}
    />
  );
}
