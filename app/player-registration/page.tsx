import { PlayerRegistrationForm } from '@/components/forms/PlayerRegistrationForm';

export default function PlayerRegistrationPage() {
  return (
    <main className="section-shell py-8 sm:py-12">
      <div className="mb-8 text-center">
        <p className="badge border-yellow-300/20 bg-yellow-300/10 text-yellow-200">APL Registration</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Register for Ashoka Premier League</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          Submit your details with a clear gallery photo. Admin approval is required before your name enters the auction.
        </p>
      </div>
      <PlayerRegistrationForm />
    </main>
  );
}
