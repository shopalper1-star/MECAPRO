import { Link } from "react-router-dom";
import MECHANIC from "/images/MECHANIC.png";
import { useTranslation } from 'react-i18next';
import './Footer.css'

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-mark">
              <img src={MECHANIC} alt="MecaPro logo" className="logo" />
            </div>
            <span className="footer-logo-text">MecaPro</span>
          </div>
          <div className="footer-columns">

            <div className="footer-column Services">
              <h4>{t('footer.services')}</h4>
              <div className="Services1">
                <div>
                  <Link to="/services#maintenance" className="link"> {t('footer.maintenance')} </Link>
                  <Link to="/services#brakes" className="link"> {t('footer.brakes')} </Link>
                  <Link to="/services#engine" className="link"> {t('footer.engine')} </Link>
                </div>
                <div>
                  <Link to="/services#electrical" className="link"> {t('footer.electrical')} </Link>
                  <Link to="/services#cooling" className="link"> {t('footer.cooling')} </Link>
                  <Link to="/services#inspection" className="link"> {t('footer.inspection')} </Link>
                </div>
              </div>
            </div>
            <div className="footer-column Company">
              <h4>{t('footer.company')}</h4>
              <Link to="/about" className="link"> {t('footer.about')} </Link>
            </div>
            <div className="footer-column Support">
              <h4>{t('footer.support')}</h4>
              <Link to="/contact" className="link"> {t('footer.contact')} </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
