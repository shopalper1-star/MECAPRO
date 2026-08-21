import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Services.css';

function Services() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const categories = [
    {
      nameKey: "services.categories.maintenance.name",
      id: "maintenance",
      services: [
        { icon: "fa-oil-can", titleKey: "services.categories.maintenance.oil_change", descKey: "services.categories.maintenance.oil_change_desc" },
        { icon: "fa-car-battery", titleKey: "services.categories.maintenance.battery", descKey: "services.categories.maintenance.battery_desc" },
        { icon: "fa-leaf", titleKey: "services.categories.maintenance.emissions", descKey: "services.categories.maintenance.emissions_desc" },
      ]
    },
    {
      nameKey: "services.categories.brakes.name",
      id: "brakes",
      services: [
        { icon: "fa-circle-stop", titleKey: "services.categories.brakes.pads", descKey: "services.categories.brakes.pads_desc" },
        { icon: "fa-dharmachakra", titleKey: "services.categories.brakes.tires", descKey: "services.categories.brakes.tires_desc" },
        { icon: "fa-road", titleKey: "services.categories.brakes.suspension", descKey: "services.categories.brakes.suspension_desc" },
        { icon: "fa-dharmachakra", titleKey: "services.categories.brakes.alignment", descKey: "services.categories.brakes.alignment_desc" },
      ]
    },
    {
      nameKey: "services.categories.engine.name",
      id: "engine",
      services: [
        { icon: "fa-microchip", titleKey: "services.categories.engine.diagnostics", descKey: "services.categories.engine.diagnostics_desc" },
        { icon: "fa-gears", titleKey: "services.categories.engine.transmission", descKey: "services.categories.engine.transmission_desc" },
        { icon: "fa-gears", titleKey: "services.categories.engine.clutch", descKey: "services.categories.engine.clutch_desc" },
      ]
    },
    {
      nameKey: "services.categories.electrical.name",
      id: "electrical",
      services: [
        { icon: "fa-bolt", titleKey: "services.categories.electrical.diagnostics", descKey: "services.categories.electrical.diagnostics_desc" },
        { icon: "fa-plug-circle-bolt", titleKey: "services.categories.electrical.repair", descKey: "services.categories.electrical.repair_desc" },
        { icon: "fa-gas-pump", titleKey: "services.categories.electrical.fuel", descKey: "services.categories.electrical.fuel_desc" },
      ]
    },
    {
      nameKey: "services.categories.cooling.name",
      id: "cooling",
      services: [
        { icon: "fa-temperature-half", titleKey: "services.categories.cooling.radiator", descKey: "services.categories.cooling.radiator_desc" },
        { icon: "fa-wind", titleKey: "services.categories.cooling.exhaust", descKey: "services.categories.cooling.exhaust_desc" },
        { icon: "fa-fan", titleKey: "services.categories.cooling.ac", descKey: "services.categories.cooling.ac_desc" },
      ]
    },
    {
      nameKey: "services.categories.inspection.name",
      id: "inspection",
      services: [
        { icon: "fa-shield", titleKey: "services.categories.inspection.safety", descKey: "services.categories.inspection.safety_desc" },
        { icon: "fa-screwdriver-wrench", titleKey: "services.categories.inspection.detailing", descKey: "services.categories.inspection.detailing_desc" },
      ]
    },
  ];

  return (
    <div className="services-page">

      <div className="services-hero">
        <div className="services-hero-content">
          <h1>{t('services.title')}</h1>
          <p>{t('services.subtitle')}</p>
        </div>
      </div>

      <div className="services-container">
        {categories.map((category, index) => (
          <div key={index} className="service-category" id={category.id}>
            <h2 className="category-title">{t(category.nameKey)}</h2>
            <div className="services-grid">
              {category.services.map((service, i) => (
                <div key={i} className="service-card">
                  <i className={`fa-solid ${service.icon} service-icon`}></i>
                  <h3 className="service-title">{t(service.titleKey)}</h3>
                  <p className="service-description">{t(service.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="services-footer">
        <Link to="/contact" className="support-badge">
          <i className="fa-solid fa-shield-halved"></i>
          <span>{t('services.support')}</span>
        </Link>
      </div>

    </div>
  );
}

export default Services;