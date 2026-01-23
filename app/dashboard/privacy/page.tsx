'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { HeadlineLarge, HeadlineMedium, TitleLarge, BodyLarge, BodyMedium } from '@/components/m3'

export default function PrivacyPolicy() {
  const { colors } = useTheme()

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl"
        style={{ backgroundColor: colors.surface }}
      >
        <HeadlineLarge className="mb-4">Privacy Policy for Ban Guide</HeadlineLarge>
        <BodyMedium color="onSurfaceVariant" className="mb-6">
          Last updated: January 23, 2026
        </BodyMedium>
        
        <BodyLarge className="mb-6">
          This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service.
        </BodyLarge>

        {/* Interpretation */}
        <HeadlineMedium className="mt-8 mb-4">Interpretation and Definitions</HeadlineMedium>
        <BodyMedium className="mb-6">
          The words of which the initial letter is capitalized have meanings defined under the following conditions.
        </BodyMedium>

        {/* Main Section */}
        <HeadlineMedium className="mt-8 mb-4">Collecting and Using Your Personal Data</HeadlineMedium>
        
        {/* 1. Location Data */}
        <TitleLarge className="mt-6 mb-3">1. Location Data</TitleLarge>
        <BodyMedium className="mb-6">
          We may use and store information about your location if you give us permission to do so. We use this data to provide features of our Service (finding nearby places and services) and to improve our Service. You can enable or disable location services when you use our Service at any time, through your device settings.
        </BodyMedium>

        {/* 2. Camera and Photos */}
        <TitleLarge className="mt-6 mb-3">2. Camera and Photos</TitleLarge>
        <BodyMedium className="mb-6">
          Our Service may require access to your device's camera and photo gallery. This access is used to allow you to upload photos of places, services, or set a profile picture. We do not access your private photos without your explicit permission.
        </BodyMedium>

        {/* 3. Microphone */}
        <TitleLarge className="mt-6 mb-3">3. Microphone and Audio</TitleLarge>
        <BodyMedium className="mb-6">
          We may request access to your microphone to enable voice search features or voice commands within the app. Audio data is not recorded or stored on our servers unless explicitly stated for a specific feature.
        </BodyMedium>

        {/* 4. Files and Storage */}
        <TitleLarge className="mt-6 mb-3">4. Files and Storage</TitleLarge>
        <BodyMedium className="mb-6">
          We may require access to your device's storage to read and write files necessary for the app's operation, such as caching images or saving your preferences.
        </BodyMedium>

        {/* 5. Push Notifications */}
        <TitleLarge className="mt-6 mb-3">5. Push Notifications</TitleLarge>
        <BodyMedium className="mb-6">
          We may use push notifications to send you updates, alerts regarding your account, or information about new places and services. You can opt-out of these communications in your device settings.
        </BodyMedium>

        {/* Usage Data */}
        <TitleLarge className="mt-6 mb-3">Usage Data</TitleLarge>
        <BodyMedium className="mb-6">
          Usage Data is collected automatically when using the Service. It may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit.
        </BodyMedium>

        {/* Contact Us */}
        <HeadlineMedium className="mt-8 mb-4">Contact Us</HeadlineMedium>
        <BodyMedium className="mb-2">
          If you have any questions about this Privacy Policy, You can contact us:
        </BodyMedium>
        <ul className="list-disc mr-6 mt-2">
          <li>
            <BodyMedium>
              By email: <a 
                href="mailto:ie4951611@gmail.com"
                style={{ color: colors.primary }}
                className="hover:underline"
              >
                ie4951611@gmail.com
              </a>
            </BodyMedium>
          </li>
        </ul>
      </div>
    </div>
  )
}
