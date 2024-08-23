import { resend } from "./index.js";
import RegistrationEmail from "./templates/regMail.js";
import { ApiResponse } from "../utils/apiResponse.js";

export async function sendRegMail(
  email: string,
  userName: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email.trim(),
      subject: 'Registration Verification Code',
      react: RegistrationEmail({ userName, otp: verifyCode }),
    });
    return { success: true, message: 'Verification email sent successfully.', statusCode: 200 };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.', statusCode: 500 };
  }
}