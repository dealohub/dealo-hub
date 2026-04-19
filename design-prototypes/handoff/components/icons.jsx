/**
 * Lucide icons used by EcommerceNavbar1 + BackgroundPattern115 demo.
 * Matches lucide-react stroke conventions (24×24, 1.75 stroke, round caps).
 */
const mkIcon = (paths) => ({ size = 16, className = "", strokeWidth = 1.75, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className} {...rest}>{paths}</svg>
);

const Menu            = mkIcon(<><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>);
const X               = mkIcon(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
const ChevronLeft     = mkIcon(<path d="m15 18-6-6 6-6"/>);
const ChevronRight    = mkIcon(<path d="m9 18 6-6-6-6"/>);
const ChevronDown     = mkIcon(<path d="m6 9 6 6 6-6"/>);
const Search          = mkIcon(<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>);
const CircleUserRound = mkIcon(<><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></>);
const ShoppingBag     = mkIcon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></>);
const Phone           = mkIcon(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>);
const Send            = mkIcon(<><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>);
const ArrowRight      = mkIcon(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>);
const Forward         = mkIcon(<><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></>);

Object.assign(window, {
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, Search,
  CircleUserRound, ShoppingBag, Phone, Send, ArrowRight, Forward,
});
