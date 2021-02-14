// Quick and dirty 'dig' wrapper
import { exec } from "child_process";
import { format as sprintf } from "util";

const DIG = "dig";

interface DigAnswer {
  name: string;
  ttl: number;
  type: string;
  target: string;
}

function parseAnswer(tokens: string[]): DigAnswer {
  const t = tokens.filter(function (v) {
    return v !== "" ? v : undefined;
  });

  return {
    name: t[0],
    ttl: parseInt(t[1], 10),
    type: t[3],
    target: t[4],
  };
}

interface DigResults {
  question: string | null;
  answers: DigAnswer[];
  additional: [];
  authority: [];
}

function parseDig(output: string): DigResults {
  const lines = output.split(/\n/);
  let section: string | undefined = "header";

  const results: DigResults = {
    question: null,
    answers: [],
    additional: [],
    authority: [],
  };

  lines.forEach(function (l) {
    if (l === "") {
      section = undefined;
    } else if (/^;; QUESTION SECTION:/.test(l)) {
      section = "question";
    } else if (/^;; ANSWER SECTION:/.test(l)) {
      section = "answer";
    } else if (/^;; ADDITIONAL SECTION:/.test(l)) {
      section = "additional";
    } else if (/^;; AUTHORITY SECTION:/.test(l)) {
      section = "authority";
    }

    if (section === "question") {
      if (/^;([A-Za-z0-9])*\./.test(l)) {
        results.question = l.match(/([A-Za-z0-9_\-.])+/)![0];
      }
    }

    if (section === "answer") {
      if (/^([_A-Za-z0-9])+/.test(l)) {
        const tokens = l.match(/(.*)/)![0].split(/\t/);
        const answer = parseAnswer(tokens);
        if (answer) results.answers.push(answer);
      }
    }
  });

  return results;
}

export function dig(
  name: string,
  type: string,
  options: { server?: string; port?: number } = {}
): Promise<DigResults> {
  type = type.toUpperCase();

  let opts = "";
  if (options.server) opts += " @" + options.server;
  if (options.port) opts += " -p " + options.port;

  const cmd = sprintf("%s %s -t %s %s +time=1 +retry=0", DIG, opts, type, name);
  return new Promise((resolve, reject) =>
    exec(cmd, (err, stdout, stderr) =>
      err ? reject(err) : resolve(parseDig(stdout))
    )
  );
}
