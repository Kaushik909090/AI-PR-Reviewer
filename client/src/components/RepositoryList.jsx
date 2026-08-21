import React from "react";
import RepositoryCard from "./RepositoryCard";

function RepositoryList({
    repositories,
    loading,
}) {

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {[1, 2, 3].map((item) => (

                    <div
                        key={item}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse"
                    >

                        <div className="flex items-start justify-between">

                            <div className="w-11 h-11 rounded-xl bg-slate-800" />

                            <div className="w-16 h-6 rounded-full bg-slate-800" />

                        </div>


                        <div className="mt-5 h-5 w-2/3 rounded bg-slate-800" />

                        <div className="mt-3 h-3 w-full rounded bg-slate-800" />

                        <div className="mt-2 h-3 w-4/5 rounded bg-slate-800" />


                        <div className="mt-6 flex gap-2">

                            <div className="h-6 w-20 rounded-full bg-slate-800" />

                            <div className="h-6 w-16 rounded-full bg-slate-800" />

                        </div>


                        <div className="mt-6 h-10 rounded-xl bg-slate-800" />

                    </div>

                ))}

            </div>

        );

    }


    // ========================================================
    // EMPTY
    // ========================================================

    if (!repositories || !repositories.length) {

        return (

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">

                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                    📁
                </div>


                <h3 className="mt-5 text-lg font-semibold text-slate-200">
                    No GitHub repositories found
                </h3>


                <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
                    We couldn't find any repositories available through
                    your connected GitHub account.
                </p>

            </div>

        );

    }


    // ========================================================
    // REPOSITORY LIST
    // ========================================================

    return (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {repositories.map((repo) => (

                <RepositoryCard
                    key={repo.id}
                    repo={repo}
                />

            ))}

        </div>

    );

}


export default RepositoryList;