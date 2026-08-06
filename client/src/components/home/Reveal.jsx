import { useScrollReveal } from '../../hooks/useScrollReveal';

function Reveal({ children, delay = 0 }) {
    const [ref, isVisible] = useScrollReveal();

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
        >
            {children}
        </div>
    );
}

export default Reveal;