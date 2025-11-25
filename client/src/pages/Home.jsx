import React from "react";
import PageLayout from "../components/layouts/PageLayout";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import Testimonials from "../components/home/Testimonials";

const Home = () => {
  return (
    <PageLayout>
      <Hero />
      <Features />
      <Testimonials />
    </PageLayout>
  );
};

export default Home;
