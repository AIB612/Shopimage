import { PageLayout } from "@/components/PageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "How does Shopimage optimize my images?",
      answer: "Shopimage uses advanced compression algorithms to reduce image file sizes by up to 70% while maintaining visual quality. We convert images to modern formats like WebP and apply smart optimization techniques."
    },
    {
      question: "Will optimizing images affect their quality?",
      answer: "No! We use high-quality compression (85% quality setting) that maintains visual fidelity while significantly reducing file size. Most users cannot tell the difference between original and optimized images."
    },
    {
      question: "How many images can I optimize for free?",
      answer: "The free plan allows you to optimize up to 5 images per scan. This is perfect for testing the service and seeing the results before upgrading to Pro for unlimited optimizations."
    },
    {
      question: "What happens after I sync optimized images?",
      answer: "When you sync, the optimized images replace the originals in your Shopify store. Your product pages will load faster, improving SEO and conversion rates. The original images are safely stored by Shopify."
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer: "Yes! You can cancel your Pro subscription at any time from your Shopify admin. There are no long-term contracts or cancellation fees."
    },
    {
      question: "How much faster will my store be?",
      answer: "Most stores see 2-4 seconds improvement in page load time after optimizing images. This can lead to better SEO rankings and higher conversion rates."
    },
    {
      question: "Do you support all image formats?",
      answer: "Yes! We support JPG, PNG, WebP, and other common image formats. We automatically choose the best output format for each image."
    },
    {
      question: "Is my data safe?",
      answer: "Absolutely. We only access your product images through Shopify's secure API. We don't store your images permanently and all data transmission is encrypted."
    }
  ];

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Shopimage
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 p-6 bg-primary/5 rounded-lg text-center">
          <h3 className="font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Contact us at support@shopimage.app
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
