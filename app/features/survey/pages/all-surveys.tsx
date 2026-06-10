import { useEffect, useState } from "react";
import SurveyCard from "../components/survey-card";
import { SURVEY_ABI, SURVEY_FACTORY, SURVEY_FACTORY_ABI } from "../constant";
import { useReadContract } from "wagmi";
import { createPublicClient, getContract, http } from "viem";
import { hardhat, kairos } from "viem/chains";
import { supabase } from "~/postgres/supaclient";
import { type Database } from "database.types";

type SurveyRow = Database["public"]["Tables"]["survey"]["Row"];
interface surveyMeta {
  title: string;
  description: string;
  count: number;
  view: number | null;
  image: string | null;
  address: string;
}
export default function AllSruveys() {
  const [surveys, setSurveys] = useState<surveyMeta[]>([]);
  const onChainLoader = async () => {
    const client = createPublicClient({
      chain: kairos,
      transport: http(),
    });
    const surveyFactroyContract = getContract({
      address: SURVEY_FACTORY,
      abi: SURVEY_FACTORY_ABI,
      client,
    });
    const surveys = await surveyFactroyContract.read.getSurveys();
    const surveyMetadata = await Promise.all(
      surveys.map(async (surveyAddress) => {
        const surveyContract = getContract({
          address: surveyAddress,
          abi: SURVEY_ABI,
          client,
        });
        const title = await surveyContract.read.title();
        const description = await surveyContract.read.description();
        const answers = await surveyContract.read.getAnswers();
        const { data, error } = await supabase
          .from("survey")
          .select("image, view")
          .eq("id", surveyAddress)
          .single(); // ← row 하나면 single()이 안정적임

        if (error) {
          console.error("Failed to load survey:", error);
          return {
            title,
            description,
            count: answers.length,
            view: 1600,
            image:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif",
            address: surveyAddress,
          };
        }

        const image =
          data.image ??
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif";
        const view = data.view ?? 1600;

        return {
          title,
          description,
          count: answers.length,
          view,
          image,
          address: surveyAddress,
        };
      }),
    );
    return surveyMetadata;
  };

  const offChainLoader = async (): Promise<surveyMeta[]> => {
    const { data, error } = await supabase.from("survey").select("*");
    if (error) {
      console.error("Failed to load surveys:", error);
      return []; // 혹은 throw error 해서 상위에서 처리
    }

    if (!data) return [];
    const surveys = data as SurveyRow[];

    const surveyMetadata = surveys.map((survey) => ({
      title: survey.title,
      description: survey.description,
      count: 10,
      view: survey.view ?? 1600,
      image: survey.image,
      address: survey.id,
    }));
    return surveyMetadata;
    // return [
    //   {
    //     title: "New Survey",
    //     description: "Override test",
    //     count: 10,
    //     view: 1600,
    //     image:
    //       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif",
    //     address: "",
    //   },
    // ];
  };
  // useEffect(() => {
  //   const onChaindata = async () => {
  //     await new Promise((resolve) => setTimeout(resolve, 3000));
  //     const onchainSurveys = await onChainLoader();
  //     setSurveys(onchainSurveys);
  //   };
  //   onChaindata();
  //   const offChaindata = async () => {
  //     const offchainSurveys = await offChainLoader();
  //     setSurveys(offchainSurveys);
  //   };
  //   offChaindata();
  // }, []);
  useEffect(() => {
    (async () => {
      // 1) 오프체인 먼저
      const offchainSurveys = await offChainLoader();
      setSurveys(offchainSurveys);
      // 2) 그 다음 온체인으로 덮어쓰기 (성공하면)
      try {
        const onchainSurveys = await onChainLoader();
        setSurveys(onchainSurveys);
      } catch (e) {
        console.error("onChainLoader failed, keep offchain data:", e);
      }
    })();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 overflow-y-auto h-[90vh]">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-2xl font-extrabold">Live Surveys</h1>
        <span className="font-light"> Join the surveys!</span>
      </div>
      {surveys.map((survey) => (
        <SurveyCard
          title={survey.title}
          description={survey.description}
          view={survey.view!}
          count={survey.count}
          image={survey.image!}
          address={survey.address}
        />
      ))}
    </div>
  );
}
