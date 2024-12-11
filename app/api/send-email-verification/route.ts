// app/api/send-email-verification/route.ts
import nodemailer from "nodemailer";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      console.error("Email address not provided.");
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rodopi1000@gmail.com", // Замените на ваш Gmail
        pass: "sokn alnc wmab syhc", // Замените на ваш пароль
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "rodopi1000@gmail.com", // Можно указать любой email
      to: email, // Получатель кода
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ verificationCode }, { status: 200 });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
