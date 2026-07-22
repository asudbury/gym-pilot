type UserRolesDisplayProps = {
  displayRoles: string[];
};

export function UserRolesDisplay({ displayRoles }: UserRolesDisplayProps) {
  return (
    <>
      <p className="font-medium">Your roles</p>
      <p className="text-sm text-slate-400">
        These are the permissions currently assigned to your account.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {displayRoles.map((role) => (
          <span
            key={role}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            {role}
          </span>
        ))}
      </div>
    </>

  );
}