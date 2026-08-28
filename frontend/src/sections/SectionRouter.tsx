import type { SectionData } from "@/data/content";
import { HeroSection } from "./HeroSection";
import { HiddenWeightSection } from "./HiddenWeightSection";
import { GoogleCaptureSection } from "./GoogleCaptureSection";
import { NarrativeSection } from "./NarrativeSection";
import { HeartSection } from "./HeartSection";
import { RecognitionSection } from "./RecognitionSection";
import { FormSection } from "./FormSection";
import { RevenueCalculator } from "./RevenueCalculator";
import { AddressAutofillDemo } from "./AddressAutofillDemo";
import { ExtensionFillDemo } from "./ExtensionFillDemo";
import { AIMarketingDemo } from "./AIMarketingDemo";

interface SectionRouterProps {
  data: SectionData;
  sharedMlsData: any | null;
  setSharedMlsData: (data: any | null) => void;
}

export function SectionRouter({ data, sharedMlsData, setSharedMlsData }: SectionRouterProps) {
  switch (data.id) {
    case "open":
      return <HeroSection data={data} />;
    case "hidden-weight":
      return <HiddenWeightSection data={data} />;
    case "platform-demo":
      return <AddressAutofillDemo data={data} setSharedMlsData={setSharedMlsData} />;
    case "ai-marketing":
      return <AIMarketingDemo data={data} sharedMlsData={sharedMlsData} />;
    case "extension-demo":
      return <ExtensionFillDemo data={data} sharedMlsData={sharedMlsData} />;
    case "revenue-calculator":
      return <RevenueCalculator data={data} />;
    case "google-capture":
      return <GoogleCaptureSection data={data} />;
    case "heart":
      return <HeartSection data={data} />;
    case "recognition":
      return <RecognitionSection data={data} />;
    case "built-for-next":
    case "close":
      return <NarrativeSection data={data} align="left" />;
    case "form":
      return <FormSection data={data} />;
    default:
      return <NarrativeSection data={data} />;
  }
}
