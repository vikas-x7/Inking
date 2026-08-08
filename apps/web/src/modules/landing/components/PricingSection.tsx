'use client';
import React from 'react';
import Link from 'next/link';

export default function PricingSection() {
  const services = [
    {
      price: '$400',
      priceNote: '*starting price',
      title: 'Website Copy',
      description: 'Includes homepage, about page, and contact page',
    },
    {
      price: '$150',
      priceNote: '*per post',
      title: 'Blog Writing',
      description: 'SEO-optimized, 800-1000 words',
    },
    {
      price: '$25',
      priceNote: '*per product',
      title: 'Product Descriptions',
      description: 'SEO-optimized, 800-1000 words',
    },
    {
      price: '$50',
      priceNote: '*each post',
      title: 'Media Content',
      description: '3 Daily Posts to grow online presence',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8  bg-black text-white font-sans">
      <div className="max-w-6xl mx-auto my-40">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column - Dark Card */}
          <div className="bg-[#141414] border border-white/10 text-white rounded-[8px] p-8 md:px-10 py-8 shadow-xl">
            <h2 className="text-4xl md:text-3xl font-serif mb-8">Transparent Pricing</h2>

            <div className="border-t border-dashed border-[#717172] my-8" />

            <div className="mt-12">
              <p className="text-gray-400 mb-2">Need Something</p>
              <h3 className="text-2xl font-bold mb-6">Custom?</h3>

              <p className="text-gray-300 mb-8 leading-relaxed">
                If you need any of these services
                <br />
                or a completely customized solution,
                <br />
                feel free to reach out.
              </p>

              <div className="mt-10">
                <p className="text-gray-300 mb-4">
                  Let's discuss how
                  <br />
                  <span className="font-semibold">I can help you.</span>
                </p>

                <Link
                  href="/auth"
                  className="inline-block bg-white text-black font-bold py-2.5 px-8 rounded-[5px] transition-all duration-200 shadow-lg hover:bg-gray-200"
                >
                  GET STARTED
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Services Grid */}
          <div>
            <div className="mb-8">
              <p className="text-gray-300 leading-relaxed text-[17px]">
                Every great piece of content is priced transparently. I match every word with your
                goals, ensuring value and clarity for each project.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="p-6 border border-white/20 border-dashed rounded-[6px] bg-[#141414]/60 transition-shadow duration-200 text-left"
                >
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-white mb-1">{service.price}</div>
                    <div className="text-sm text-gray-400">{service.priceNote}</div>
                  </div>

                  <h4 className="text-xl font-bold text-white mb-2">{service.title}</h4>

                  <p className="text-gray-400 text-sm leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
