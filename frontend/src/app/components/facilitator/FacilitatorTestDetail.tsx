import { useState } from "react";
import { useParams } from "react-router";
import { AlertCircle, CheckCircle, ExternalLink, FileQuestion, Lock } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getStrandTest } from "../../../lib/api/facilitatorTests";
import type { StrandTestType, StrandTestViewerQuestion } from "../../../lib/api/types";
import { useFetch } from "../../../lib/hooks/useFetch";
import { parseIdParam } from "../../../lib/learnersText";
import {
  ANSWER_KEY_NOTICE,
  LOCKED_EXPLANATION,
  TEST_NOT_FOUND_TEXT,
  assetKind,
  integrityNoticeText,
  itemProblemLabel,
  itemProblems,
  optionLetter,
  testCountsText,
  testFailureText,
  testStatusLabel,
  testTypeLabel,
  type ItemProblem,
} from "../../../lib/testsText";
import { Button, Card, EmptyState, ErrorState, LoadingState, Notice, PageHeader, Pill, type PillTone } from "./shared";

// Passed as currentPage too, so the sidebar entry stays highlighted on the detail.
const TESTS_PAGE = "facilitator-tests";

const TYPE_TONE: Record<StrandTestType, PillTone> = { pretest: "neutral", posttest: "success" };

interface ItemAssetProps {
  url: string;
  /** Refetches the test, which brings fresh links. */
  onReload: () => void;
}

/**
 * An item's attachment. The learner's test shows it as an image; here an
 * audio file gets a player and anything unrecognised a plain link. The link
 * is signed and stops working after about an hour, so a failed load offers to
 * fetch the test again.
 */
function ItemAsset({ url, onReload }: ItemAssetProps) {
  // Remembers which link failed, so a fresh link after a reload gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const kind = assetKind(url);

  if (failedUrl === url) {
    return (
      <div className="flex items-center gap-2 flex-wrap p-3 bg-[#F2F1ED] border border-[#E2E0DA] rounded-xl text-[#4A4F5C] text-[0.9375rem]" role="alert">
        <AlertCircle className="w-5 h-5 text-[#4A4F5C] flex-shrink-0" aria-hidden="true" />
        Attachment could not be loaded
        <Button variant="link" onClick={onReload}>Reload</Button>
      </div>
    );
  }

  if (kind === "image") {
    return (
      <img
        src={url}
        alt="Illustration for this question"
        className="max-h-72 w-auto max-w-full object-contain rounded-xl"
        onError={() => setFailedUrl(url)}
      />
    );
  }

  if (kind === "audio") {
    return (
      <audio controls preload="metadata" src={url} className="w-full max-w-md" aria-label="Audio for this question" onError={() => setFailedUrl(url)} />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[#00538A] hover:text-[#004270] text-[0.9375rem] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A] rounded-md"
    >
      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Open attachment
    </a>
  );
}

interface ItemCardProps {
  item: StrandTestViewerQuestion;
  number: number;
  problem: ItemProblem | undefined;
  onReload: () => void;
}

function ItemCard({ item, number, problem, onReload }: ItemCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-lg bg-[#F2F1ED] text-[#1B1D26] text-[0.9375rem] font-bold tabular-nums flex items-center justify-center flex-shrink-0" aria-label={`Item ${number}`}>
          {number}
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          {problem && (
            <Pill tone="warning">
              <AlertCircle className="w-3 h-3" aria-hidden="true" /> {itemProblemLabel(problem)}
            </Pill>
          )}
          <p className="text-[#1B1D26] text-[0.9375rem] font-medium leading-relaxed whitespace-pre-line">{item.question_text}</p>
          {item.asset_url && <ItemAsset url={item.asset_url} onReload={onReload} />}

          {item.options.length === 0 ? (
            <p className="text-[#4A4F5C] text-[0.9375rem]">This item has no options.</p>
          ) : (
            <ol className="space-y-2">
              {item.options.map((option, index) => (
                <li
                  key={option.id}
                  className={`flex items-start gap-3 p-3 border rounded-xl text-[0.9375rem] ${option.is_correct ? "border-[#00538A] bg-[#CFE4FF]" : "border-[#E2E0DA]"}`}
                >
                  <span className="text-[#4A4F5C] font-bold flex-shrink-0">{optionLetter(index)}.</span>
                  <span className="text-[#1B1D26] min-w-0 flex-1 whitespace-pre-line">{option.option_text}</span>
                  {/* Marked with an icon and words, not by colour alone. */}
                  {option.is_correct && (
                    <span className="inline-flex items-center gap-1 text-[#00538A] text-[0.9375rem] font-bold whitespace-nowrap flex-shrink-0">
                      <CheckCircle className="w-4 h-4" aria-hidden="true" /> Correct answer
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Card>
  );
}

export function FacilitatorTestDetail({ navigate, user, onLogout }: PageProps) {
  // The test comes from the URL. Nothing on this page - the answer key least
  // of all - is kept in localStorage, sessionStorage, or a store.
  const params = useParams();
  const testId = parseIdParam(params.testId);

  // Keyed on the id: moving to another test reloads, and a slow earlier response is dropped by the hook.
  const detail = useFetch(() => getStrandTest(testId as number), [testId], {
    enabled: testId !== null,
    fallbackError: "Unable to load this test.",
  });
  const data = detail.data;

  const backButton = <Button variant="link" onClick={() => navigate(TESTS_PAGE)}>Back to Strand Tests</Button>;
  const notFound = (
    <Card padding="none">
      <EmptyState icon={FileQuestion} title="Test not found" description={TEST_NOT_FOUND_TEXT} action={backButton} />
    </Card>
  );

  let body;
  if (testId === null) {
    // Not a number: no request is sent.
    body = notFound;
  } else if (detail.error) {
    const failure = testFailureText(detail.errorStatus, detail.error);
    body =
      detail.errorStatus === 404 ? (
        notFound
      ) : (
        <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? detail.reload : undefined} />
      );
  } else if (!data) {
    body = <LoadingState label="Loading the test…" />;
  } else {
    const problems = itemProblems(data.integrity);
    const integrityNotice = integrityNoticeText(data.integrity);
    body = (
      <>
        <Notice>{ANSWER_KEY_NOTICE}</Notice>
        {integrityNotice && <Notice tone="warning" title="This test has items that need fixing.">{integrityNotice}</Notice>}

        {data.items.length === 0 ? (
          <Card padding="none"><EmptyState icon={FileQuestion} title="This test has no items yet" /></Card>
        ) : (
          <div className="space-y-3">
            {data.items.map((item, index) => (
              <ItemCard key={item.id} item={item} number={index + 1} problem={problems.get(item.id)} onReload={detail.reload} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage={TESTS_PAGE} hideCohortControls>
      <div className="p-6 space-y-6">
        <PageHeader
          backLabel="Back to Strand Tests"
          onBack={() => navigate(TESTS_PAGE)}
          eyebrow="Strand Test"
          title={data ? data.title : "Strand Test"}
          subtitle={
            data ? (
              <span className="flex items-center gap-2 flex-wrap">
                <span>{data.strand_code} · {data.strand_name}</span>
                <Pill tone={TYPE_TONE[data.type] ?? "muted"}>{testTypeLabel(data.type)}</Pill>
                {data.is_locked ? (
                  <span title={LOCKED_EXPLANATION}>
                    <Pill tone="warning"><Lock className="w-3 h-3" aria-hidden="true" /> {testStatusLabel(true)}</Pill>
                  </span>
                ) : (
                  <Pill tone="muted">{testStatusLabel(false)}</Pill>
                )}
                <span>{testCountsText(data.item_count, data.attempt_count)}</span>
              </span>
            ) : undefined
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
