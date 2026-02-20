import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is Shopimage?",
    answer: "Shopimage is an AI-powered image optimization tool designed specifically for e-commerce stores. It helps Shopify, WooCommerce, and other online shop owners compress and convert product images to WebP format, reducing file sizes by up to 80% while maintaining visual quality."
  },
  {
    question: "How does Shopimage improve my store's speed?",
    answer: "Large product images are the #1 cause of slow e-commerce sites. Shopimage automatically compresses your images and converts them to modern WebP format, which can improve your page load speed by 50-70%. Faster sites mean better SEO rankings and higher conversion rates."
  },
  {
    question: "Does Shopimage work with Shopify?",
    answer: "Yes! Shopimage is fully compatible with Shopify stores. You can use our Chrome extension to scan your Shopify admin and optimize product images directly, or use our web app to process images before uploading them to your store."
  },
  {
    question: "Does Shopimage work with WooCommerce?",
    answer: "Absolutely! Shopimage works seamlessly with WooCommerce and WordPress. Our tool can scan your WooCommerce product pages and identify images that need optimization, then compress them for faster loading."
  },
  {
    question: "Is Shopimage free to use?",
    answer: "Shopimage offers a free tier that allows you to optimize up to 50 images per month. For larger stores or agencies, we offer Pro and Enterprise plans with unlimited image optimization and additional features like bulk processing and API access."
  },
  {
    question: "What image formats does Shopimage support?",
    answer: "Shopimage supports all common image formats including JPG, JPEG, PNG, GIF, and WebP. We can convert any of these formats to optimized WebP, which offers the best compression-to-quality ratio for web images."
  },
  {
    question: "Will image compression affect my product photo quality?",
    answer: "No! Shopimage uses advanced AI compression algorithms that reduce file size while preserving visual quality. Our smart compression analyzes each image and applies the optimal compression level to maintain crisp, professional-looking product photos."
  },
  {
    question: "How do I install the Shopimage Chrome extension?",
    answer: "Visit the Chrome Web Store and search for 'Shopimage' or click the install link on our website. Once installed, the extension will appear in your browser toolbar. Click it while on your Shopify or WooCommerce admin to start scanning for unoptimized images."
  },
  {
    question: "Can Shopimage help with SEO?",
    answer: "Yes! Page speed is a major Google ranking factor. By optimizing your product images with Shopimage, you'll improve your Core Web Vitals scores, which directly impacts your search engine rankings. Faster sites also have lower bounce rates and higher engagement."
  },
  {
    question: "What is WebP format and why should I use it?",
    answer: "WebP is a modern image format developed by Google that provides superior compression compared to JPG and PNG. WebP images are typically 25-35% smaller than equivalent JPG files with the same visual quality. All modern browsers support WebP, making it the ideal format for e-commerce product images."
  },
  {
    question: "How is Shopimage different from other image optimizers?",
    answer: "Shopimage is built specifically for e-commerce. Unlike generic image tools, we understand the unique needs of online stores - product image requirements, platform integrations (Shopify, WooCommerce), and the importance of maintaining product photo quality while maximizing compression."
  },
  {
    question: "Does Shopimage offer an API?",
    answer: "Yes! Our Pro and Enterprise plans include API access for automated image optimization. You can integrate Shopimage into your workflow, CI/CD pipeline, or custom applications to automatically optimize images as they're uploaded."
  }
];

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-4 -mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-8">{item.question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 px-4 -mx-4">
          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Schema.org FAQ structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Shopimage and how it can help optimize your e-commerce store's images.
          </p>
        </div>

        {/* FAQ List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {faqs.map((faq, index) => (
            <FAQItemComponent
              key={index}
              item={faq}
              isOpen={openIndex === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Can't find the answer you're looking for? Feel free to reach out to our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <a className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                Try Shopimage Free
              </a>
            </Link>
            <a
              href="mailto:support@shopimage.dropking.ch"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 Shopimage. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/privacy"><a className="hover:text-emerald-600">Privacy Policy</a></Link>
            <Link href="/terms"><a className="hover:text-emerald-600">Terms of Service</a></Link>
            <Link href="/pricing"><a className="hover:text-emerald-600">Pricing</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
