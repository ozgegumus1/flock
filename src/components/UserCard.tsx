interface UserCardProps {
    username: string
    handle: string
}

function UserCard({username, handle}: UserCardProps) {
return (
<div className="flex items-center justify-between p-2 rounded-xl hover:bg*gray-700 transition cursor-pointer">
<div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
    <div>
        <p className="text-white font-bold text-sm">{username}</p>
        <p className="text-gray-400 text-xs">{handle}</p>
    </div>
</div>
<button className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-200 transition">Takip</button>
</div>
)
}

export default UserCard