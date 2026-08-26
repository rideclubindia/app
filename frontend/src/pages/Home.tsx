import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { SpeedCockpit } from '../components/home/SpeedCockpit';
import { Helmet } from 'react-helmet-async';
import { Home as HomeIcon, Route as RouteIcon, ShieldCheck, User } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { HomeLandscape } from '../components/HomeLandscape';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { speed, coordinates, error: locationError } = useLocationStore();
  const { currentRide } = (useOutletContext<{ currentRide: any }>() || {}) as { currentRide?: any };

  return (
    <>
      <Helmet>
        <title>Home | Ride Club</title>
      </Helmet>
      <HomeLandscape currentRide={currentRide} />
    </>
  );
};

export default Home;
