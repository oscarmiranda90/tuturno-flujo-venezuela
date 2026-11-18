import type {ReactNode} from 'react';
export function PortraitLayer({state,children}:{state:string;children:ReactNode}) {return <div className="login-portrait" data-state={state} aria-hidden="true">{children}</div>}
export function Testimonials({children,height=84}:{children:ReactNode;height?:number}) {return <div className="login-testimonials" style={{height}}>{children}</div>}
export function TestimonialLayer({active,children}:{active:boolean;children:ReactNode}) {return <div className="login-testimonial" data-active={active} aria-hidden={!active}>{children}</div>}
