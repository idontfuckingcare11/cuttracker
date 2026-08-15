import clsx from 'clsx';

export function Card({ className, children, ...rest }) {
  return (
    <div className={clsx('card-base', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div>
        {title ? <h3 className="text-sm font-semibold text-ink dark:text-neutral-100">{title}</h3> : null}
        {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
