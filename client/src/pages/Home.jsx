import React from "react";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import DoctorFeature from "../components/home/DoctorFeature";
import AchievementFeature from "../components/home/AchievementFeature";
import Testimonials from "../components/home/Testimonials";

const Home = () => {
  return (
    <>
      <Hero />
      <Features />
      <DoctorFeature />
      <AchievementFeature />
    </>
  );
};

export default Home;
