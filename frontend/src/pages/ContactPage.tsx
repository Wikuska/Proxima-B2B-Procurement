import {
  Briefcase,
  Building2,
  HelpCircle,
  MapPin,
  Receipt,
  Warehouse,
  Wrench,
} from "lucide-react";
import DepartmentCard, {
  type Department,
} from "../components/contact/DepartmentCard";
import LocationCard, {
  type Location,
} from "../components/contact/LocationCard";
import FaqAccordion from "../components/contact/FaqAccordion";
import NeighborhoodMap from "../components/contact/NeighborhoodMap";
import { faqItems } from "../config/faq";

const departments: Department[] = [
  {
    icon: Briefcase,
    title: "Sales & Orders",
    description: "Quotes, bulk orders, tenders, tracking.",
    email: "sales@proximalab.com",
    phone: "+48 22 123 45 61",
    hours: "Mon-Fri, 08:00-16:00",
  },
  {
    icon: Wrench,
    title: "Technical Support",
    description: "Equipment selection, calibration, warranty.",
    email: "support@proximalab.com",
    phone: "+48 22 123 45 62",
    hours: "Mon-Fri, 08:00-16:00",
  },
  {
    icon: Receipt,
    title: "Accounting & Billing",
    description: "Invoices, credit notes, Net 30 payments.",
    email: "billing@proximalab.com",
    phone: "+48 22 123 45 63",
    hours: "Mon-Fri, 08:00-15:00",
  },
];

const locations: Location[] = [
  {
    icon: Building2,
    title: "Headquarters",
    address: "ul. Naukowa 13, Warszawa",
  },
  {
    icon: Warehouse,
    title: "Main Lab & Warehouse",
    address: "ul. Grenadierów, Tarnów",
  },
];

export default function ContactPage() {
  return (
    <div className="w-full">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-64 md:h-72 bg-primary -z-10" />

        <div className="max-w-6xl mx-auto px-4 pt-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Support and Inquiry
            </h1>
            <p className="text-white">
              Connect with the right department for specialized assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {departments.map((department) => (
              <DepartmentCard key={department.title} department={department} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 border-b border-border-base/20 pb-3 mb-5">
              <MapPin size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-text-main">Locations</h2>
            </div>
            <NeighborhoodMap />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6.5">
              {locations.map((location) => (
                <LocationCard key={location.title} location={location} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 border-b border-border-base/20 pb-3 mb-5">
              <HelpCircle size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-text-main">
                Frequently Asked Questions
              </h2>
            </div>
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
