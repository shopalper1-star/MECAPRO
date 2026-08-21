import { useTranslation } from "react-i18next";
import "./PartnerCarousel.css";

function PartnerCarousel() {
    const { t } = useTranslation();

    // Update these paths to match where you store your logo images
    const brands = [
        { name: "BOSCH", image: "/images/brands/bosch.png" },
        { name: "MICHELIN", image: "/images/brands/michelin.png" },
        { name: "TotalEnergies", image: "/images/brands/totalenergies.png" },
        { name: "CONTINENTAL", image: "/images/brands/continental.png" },
        { name: "BREMBO", image: "/images/brands/brembo.png" },
        { name: "CASTROL", image: "/images/brands/castrol.png" },
        { name: "GOODYEAR", image: "/images/brands/goodyear.png" },
        { name: "volswagen.png", image: "/images/brands/volkswagen.png" },
        { name: "Mercedes-Benz.png", image: "/images/brands/Mercedes-Benz.png" },
        { name: "Dacia.png", image: "/images/brands/Dacia.png" },
        { name: "YAMAHA.png", image: "/images/brands/YAMAHA.png" },
        { name: "MAN.png", image: "/images/brands/MAN.png" }
    ];

    return (
        <section className="brands-section">
            <div className="section-inner">
                <h2>{t("home.trusted_brands") || "Trusted Brands"}</h2>
                <p className="section-subtitle">
                    {t("home.brands_subtitle") || "We work with industry-leading manufacturers to ensure quality and reliability"}
                </p>
            </div>
            <div className="carousel-container">
                <div className="carousel-track">
                    {/* First set of brands */}
                    {[...brands, ...brands].map((brand, index) => (
                        <div className="brand-logo" key={`brand-${index}`}>
                            <img
                                src={brand.image}
                                alt={brand.name}
                                loading="lazy"
                            />
                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}

export default PartnerCarousel;