import { ReceiptRussianRuble, SendIcon, User2Icon } from "lucide-react";
import { supabase } from "~/postgres/supaclient";
import { Form, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import MessageBubble from "../components/message-bubble";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/survey";
import React, { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { SURVEY_ABI } from "../constant";

export const loader = async ({ params }: Route.ComponentProps) => {
  const id = params.surveyId;
  await supabase.rpc("increment_survey_view", { p_id: id });
};
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const answers = Object.fromEntries(formData);
  console.log(Object.values(answers).map((str) => Number(str)));
};

interface Question {
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    question: "오늘의 기분은 어떤가요?",
    options: ["매우 나쁨", "나쁨", "보통", "좋음", "매우 좋음"],
  },
  {
    question: "가족과의 대화 빈도는?",
    options: ["거의 없음", "가끔", "보통", "자주", "매우 자주"],
  },
  {
    question: "오늘 하루 스트레스 정도는?",
    options: ["전혀 없음", "조금 있음", "보통", "많음", "매우 많음"],
  },
  {
    question: "수면의 질은 어떤가요?",
    options: ["매우 나쁨", "나쁨", "보통", "좋음", "매우 좋음"],
  },
  {
    question: "하루 평균 운동 시간은?",
    options: ["하지 않음", "30분 미만", "1시간 미만", "1~2시간", "2시간 이상"],
  },
  {
    question: "오늘 집중력은 어땠나요?",
    options: ["매우 낮음", "낮음", "보통", "높음", "매우 높음"],
  },
  {
    question: "가족과의 관계를 표현하자면?",
    options: ["거리감 있음", "조금 서먹함", "보통", "가깝다", "매우 가깝다"],
  },
  {
    question: "현재 에너지 수준은?",
    options: ["매우 피곤함", "조금 피곤함", "보통", "활기참", "매우 활기참"],
  },
  {
    question: "오늘 하루를 한 단어로 표현한다면?",
    options: ["지침", "평범", "보람", "즐거움", "감사함"],
  },
  {
    question: "전반적인 행복도를 선택해주세요.",
    options: ["매우 낮음", "낮음", "보통", "높음", "매우 높음"],
  },
];

export default function Survey({ params }: Route.ComponentProps) {
  const { data: questions } = useReadContract({
    address: params.surveyId as `0x{string}`,
    abi: SURVEY_ABI,
    functionName: "getQuestion",
    args: [],
  });
  const { data: title } = useReadContract({
    address: params.surveyId as `0x{string}`,
    abi: SURVEY_ABI,
    functionName: "title",
    args: [],
  });
  const { data: description } = useReadContract({
    address: params.surveyId as `0x{string}`,
    abi: SURVEY_ABI,
    functionName: "description",
    args: [],
  });
  const { writeContract } = useWriteContract();
  const { address } = useAccount();
  const submitAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    if (!address) {
      alert("Please connect wallet before submitting answer");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const answers: number[] = [];
    for (const value of formData.values()) {
      answers.push(Number(value));
    }
    writeContract({
      address: params.surveyId as `0x{string}`,
      abi: SURVEY_ABI,
      functionName: "submitAnswer",
      args: [
        {
          respondent: address,
          answers,
        },
      ],
    });
  };
  const { data: answers } = useReadContract({
    address: params.surveyId as `0x{string}`,
    abi: SURVEY_ABI,
    functionName: "getAnswers",
    args: [],
  });
  const { data: target } = useReadContract({
    address: params.surveyId as `0x{string}`,
    abi: SURVEY_ABI,
    functionName: "targetNumber",
    args: [],
  });
  const [counts, setCounts] = useState<Number[][]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const countAnswers = () => {
    if (!target) return;
    return questions?.map((q, i) => {
      const count = Array.from({ length: q.options.length }).fill(
        0,
      ) as number[];
      answers?.map((answer) => count[answer.answers[i]]++);
      return count.map((n) => (n / Number(target)) * 100);
    });
  };

  useEffect(() => {
    if (!answers || !questions || !address) {
      return;
    }
    for (const answer of answers) {
      if (answer.respondent === address) {
        setCounts(countAnswers() || []);
        setIsAnswered(true);
        return;
      }
    }
  }, [answers, address, target]);
  return (
    <div className="grid grid-cols-3 gap-3 ">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="font-extrabold text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {isAnswered ? (
          <CardContent className="overflow-y-auto h-[70vh]">
            <h1 className="font-semibold text-xl pb-4">Survey Progress</h1>
            <div className="gap-5 grid grid-cols-2">
              {questions?.map((q, i) => (
                <div className="flex flex-col">
                  <h1 className="font-bold">{q.question}</h1>
                  <div className="flex flex-col pl-2 gap-1">
                    {q.options.map((o, j) => (
                      <div className="flex flex-row justify-center items-center relative">
                        <div className="left-2 absolute text-xs font-semibold text-neutral-500">
                          {o}
                        </div>
                        <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary/30 w-14 h-5 rounded-full"
                            style={{ width: `${counts[i][j]}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="overflow-y-auto h-[70vh]">
            <Form onSubmit={submitAnswer} className="grid grid-cols-2">
              {questions?.map((q, i) => (
                <div className="flex flex-col">
                  <span className="mt-5 mb-1">{q.question}</span>
                  {q.options.map((o, j) => (
                    <label className="flex items-center gap-1">
                      <Input
                        type="radio"
                        name={i.toString()}
                        value={j.toString()}
                        className="hidden peer"
                      ></Input>
                      <span className="w-4 h-4 rounded-full border-2 peer-checked:bg-primary"></span>
                      <span className="font-semibold">{o}</span>
                    </label>
                  ))}
                </div>
              ))}
              <Button type="submit" className="w-full mt-3">
                Submit
              </Button>
            </Form>
          </CardContent>
        )}
      </Card>
      <Card className="col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 overflow-y-auto h-[70vh]">
          {Array.from({ length: 20 }).map((_, i) => (
            <MessageBubble sender={i % 2 == 0} />
          ))}
        </CardContent>
        <CardFooter className="w-full">
          <Form className="flex flex-row items-center relative w-full">
            <input
              type="text"
              placeholder="type a message..."
              className="border w-full h-8 rounded-2xl px-2 text-xs"
            />
            <Button className="flex flex-row justify-center items-center w-6 h-6 absolute right-2">
              <SendIcon />
            </Button>
          </Form>
        </CardFooter>
      </Card>
    </div>
  );
}
