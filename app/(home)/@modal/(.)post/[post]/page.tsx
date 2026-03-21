import ModelPostOpen from "@/app/components/ModelPostOpen";

export default function page() {
    return (
        <div className='text-3xl grid place-content-center fixed top-0 left-0 w-full h-full bg-zinc-900/30 backdrop-blur-md text-white z-20'>
            <div className="overflow-hidden">
                <div className="w-full relative h-full overflow-auto post-open">
                    <ModelPostOpen />
                </div>
            </div>
        </div>
    )
}