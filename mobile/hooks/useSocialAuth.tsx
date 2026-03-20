import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSSO, useSignIn, useSignUp, useAuth } from "@clerk/expo";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google" | "apple" | "facebook";

interface UseSocialAuthReturn {
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<void>;
  resendEmailCode: () => Promise<void>;
  sendPhoneCode: (phoneNumber: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  isLoading: boolean;
  pendingVerification: boolean;
}

const useSocialAuth = (): UseSocialAuthReturn => {
  const { startSSOFlow } = useSSO();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = useState(false);

  const isLoading =
    signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";

  /* OAuth */
  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        const redirectUrl = Linking.createURL("/");
        const result = await startSSOFlow({
          strategy: `oauth_${provider}`,
          redirectUrl,
        });
        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
        }
      } catch (err: any) {
        Alert.alert(
          "Đăng nhập thất bại",
          err?.errors?.[0]?.message ?? "Có lỗi xảy ra."
        );
      }
    },
    [startSSOFlow]
  );

  /* Email Sign-In - dùng signIn.password() theo v3 */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!signIn) return;
      try {
        const { error } = await signIn.password({
          identifier: email,
          password,
        });
        if (error) {
          Alert.alert(
            "Đăng nhập thất bại",
            error.message ?? "Email hoặc mật khẩu không đúng."
          );
        }
        // Clerk v3 tự navigate sau khi sign in thành công
      } catch (err: any) {
        Alert.alert(
          "Đăng nhập thất bại",
          err?.errors?.[0]?.message ?? "Có lỗi xảy ra."
        );
      }
    },
    [signIn]
  );

  /* Email Sign-Up - dùng signUp.password() theo v3 */
  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      if (!signUp) return;
      try {
        const { error } = await signUp.password({
          emailAddress: email,
          password,
          firstName,
          lastName,
        });

        if (error) {
          console.error(JSON.stringify(error, null, 2));
          Alert.alert("Đăng ký thất bại", error.message ?? "Có lỗi xảy ra.");
          return;
        }

        // Gửi OTP xác minh email
        await signUp.verifications.sendEmailCode();
      } catch (err: any) {
        console.error("[SignUp]", JSON.stringify(err, null, 2));
        throw err;
      }
    },
    [signUp]
  );

  /* Email OTP Verify - dùng signUp.verifications.verifyEmailCode() theo v3 */
  const verifyEmailCode = useCallback(
    async (code: string) => {
      if (!signUp) return;
      console.log('====================================');
      console.log("code", code);
      console.log('====================================');
      try {
        await signUp.verifications.verifyEmailCode({ code });

        if (signUp.status === "complete") {
          await signUp.finalize({
            navigate: ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                console.log(session?.currentTask);
                return;
              }
              // React Native: dùng router thay vì window.location
              router.replace("/(tabs)");
            },
          });
        } else {
          console.error("Sign-up không hoàn tất:", signUp.status);
          Alert.alert(
            "Xác thực thất bại",
            "Mã OTP không hợp lệ hoặc đã hết hạn."
          );
        }
      } catch (err: any) {
        console.error("[Verify]", JSON.stringify(err, null, 2));
        Alert.alert(
          "Xác thực thất bại",
          err?.errors?.[0]?.message ?? "Có lỗi xảy ra."
        );
      }
    },
    [signUp, router]
  );

  /* Resend OTP */
  const resendEmailCode = useCallback(async () => {
    if (!signUp) return;
    await signUp.verifications.sendEmailCode();
  }, [signUp]);

  /* Phone */
  const sendPhoneCode = useCallback(async (_phoneNumber: string) => {
    Alert.alert("Thông báo", "Tính năng đăng nhập bằng SĐT chưa hỗ trợ.");
  }, []);

  const verifyPhoneCode = useCallback(async (_code: string) => {}, []);

  return {
    signInWithOAuth,
    signInWithEmail,
    signUpWithEmail,
    verifyEmailCode,
    resendEmailCode,
    sendPhoneCode,
    verifyPhoneCode,
    isLoading,
    pendingVerification,
  };
};

export default useSocialAuth;