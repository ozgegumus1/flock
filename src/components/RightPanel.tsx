import UserCard from './UserCard'

function RightPanel() {
    return (
        <div className="w-80 min-h-screen bg-gray-900 flex flex-col p-4">
            <div className="bg-gray-800 rounded-2xl p-4 mb-4">
                <h2 className="text-white font-bold text-xl mb-4">Gündemde</h2>
                <div className="flex flex-col gap-3">
                    <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                        <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                        <p className="text-white font-bold">React</p>
                        <p className="text-gray-400 text-xs">1.240 post</p>
                    </div>

                    <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                        <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                        <p className="text-white font-bold">#Typescript</p>
                        <p className="text-gray-400 text-xs">890 post</p>
                    </div>

                    <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                        <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                        <p className="text-white font-bold">#Javascript</p>
                        <p className="text-gray-400 text-xs">2.100 post</p>
                    </div>


                </div>
                
            </div>
            {/*Tanıyor olabilirsin*/}
                <div className='bg-gray-800 rounded-2xl p-4'>
                    <h2 className='text-white font-bold text-xl mb-4'>Tanıyor olabilirsin</h2>
                    <div className='flex flex-col gap-3'>
                        <UserCard username='Özge Gümüş' handle='@ozge' />
                        <UserCard username='Ayşe Kaya' handle='@ayse' />
                        <UserCard username='Mehmet Demir' handle='@mehmet' />
                    </div>
                </div>

        </div>
    )
}
export default RightPanel