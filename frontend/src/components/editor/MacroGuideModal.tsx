import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface MacroCategory {
  name: string;
  description: string;
  macros: MacroInfo[];
}

interface MacroInfo {
  name: string;
  syntax: string;
  description: string;
  example: string;
  result?: string;
}

const MACRO_CATEGORIES: MacroCategory[] = [
  {
    name: 'Variables',
    description: '데이터를 저장하고 표시하는 매크로',
    macros: [
      {
        name: 'set',
        syntax: '(set: $variable to value)',
        description: '변수에 값을 저장합니다.',
        example: '(set: $name to "Alice")\n(set: $score to 100)\n(set: $isReady to true)',
        result: '변수가 설정됩니다 (화면에 표시되지 않음)',
      },
      {
        name: 'print',
        syntax: '(print: $variable)',
        description: '변수의 값을 출력합니다.',
        example: '(print: $name)\n(print: $score + 10)',
        result: 'Alice, 110',
      },
      {
        name: 'Variable Display',
        syntax: '$variableName',
        description: '변수 값을 직접 표시합니다.',
        example: '안녕하세요, $name님! 점수: $score',
        result: '안녕하세요, Alice님! 점수: 100',
      },
    ],
  },
  {
    name: 'Links & Navigation',
    description: '다른 passage로 이동하는 매크로',
    macros: [
      {
        name: 'Simple Link',
        syntax: '[[passage name]]',
        description: '다른 passage로 이동하는 링크를 만듭니다.',
        example: '[[다음 장으로]]',
        result: '클릭 가능한 "다음 장으로" 링크',
      },
      {
        name: 'Named Link',
        syntax: '[[display text->passage name]]',
        description: '표시 텍스트와 대상 passage를 따로 지정합니다.',
        example: '[[계속하기->Chapter 2]]',
        result: '"계속하기" 텍스트가 표시되고 클릭 시 "Chapter 2"로 이동',
      },
      {
        name: 'link-goto',
        syntax: '(link-goto: "text", "passage")',
        description: '매크로 형식의 링크입니다.',
        example: '(link-goto: "시작하기", "Introduction")',
        result: '클릭 가능한 링크',
      },
      {
        name: 'goto',
        syntax: '(goto: "passage")',
        description: '자동으로 다른 passage로 이동합니다.',
        example: '(goto: "Game Over")',
        result: '즉시 "Game Over" passage로 이동',
      },
      {
        name: 'display',
        syntax: '(display: "passage")',
        description: '다른 passage의 내용을 현재 위치에 삽입합니다.',
        example: '(display: "Common Header")',
        result: '"Common Header" passage의 내용이 표시됨',
      },
    ],
  },
  {
    name: 'Conditionals',
    description: '조건에 따라 다른 내용을 표시하는 매크로',
    macros: [
      {
        name: 'if',
        syntax: '(if: condition)[content]',
        description: '조건이 참일 때만 내용을 표시합니다.',
        example: '(if: $score > 50)[축하합니다! 합격입니다.]',
        result: 'score가 50보다 크면 메시지 표시',
      },
      {
        name: 'else-if',
        syntax: '(else-if: condition)[content]',
        description: 'if 조건이 거짓일 때 다른 조건을 검사합니다.',
        example: '(if: $score >= 90)[A등급]\n(else-if: $score >= 80)[B등급]',
        result: '조건에 맞는 등급 표시',
      },
      {
        name: 'else',
        syntax: '(else:)[content]',
        description: '모든 조건이 거짓일 때 표시합니다.',
        example: '(if: $hasKey)[문을 열 수 있습니다.]\n(else:)[열쇠가 필요합니다.]',
        result: 'hasKey 값에 따라 다른 메시지',
      },
      {
        name: 'cond',
        syntax: '(cond: condition, ifTrue, ifFalse)',
        description: '조건에 따라 두 값 중 하나를 선택합니다.',
        example: '결과: (cond: $score > 50, "합격", "불합격")',
        result: '결과: 합격 또는 불합격',
      },
    ],
  },
  {
    name: 'Random',
    description: '무작위 값을 생성하는 매크로',
    macros: [
      {
        name: 'random',
        syntax: '(random: min, max)',
        description: '지정된 범위 내의 무작위 정수를 생성합니다.',
        example: '주사위 결과: (random: 1, 6)',
        result: '주사위 결과: 4 (1~6 사이 무작위)',
      },
      {
        name: 'either',
        syntax: '(either: "a", "b", "c")',
        description: '주어진 값 중 하나를 무작위로 선택합니다.',
        example: '오늘의 운세: (either: "좋음", "보통", "나쁨")',
        result: '오늘의 운세: 좋음 (무작위)',
      },
    ],
  },
  {
    name: 'Text Styling',
    description: '텍스트 스타일을 변경하는 매크로',
    macros: [
      {
        name: 'text-style',
        syntax: '(text-style: "style")[text]',
        description: '텍스트 스타일을 적용합니다. (bold, italic, underline, strike, uppercase, lowercase)',
        example: '(text-style: "bold")[중요한 내용]',
        result: '<strong>중요한 내용</strong>',
      },
      {
        name: 'text-color / color',
        syntax: '(text-color: "color")[text]',
        description: '텍스트 색상을 변경합니다.',
        example: '(text-color: "red")[경고!]\n(color: "#3b82f6")[파란색 텍스트]',
        result: '<span style="color: red">경고!</span>',
      },
      {
        name: 'background',
        syntax: '(background: "color")[text]',
        description: '텍스트 배경색을 변경합니다.',
        example: '(background: "yellow")[하이라이트]',
        result: '<span style="background: yellow">하이라이트</span>',
      },
    ],
  },
  {
    name: 'Hooks',
    description: '특정 영역을 숨기거나 표시하는 매크로',
    macros: [
      {
        name: 'Hook Definition',
        syntax: '|hookName>[content]',
        description: '숨겨진 영역을 정의합니다.',
        example: '|secret>[이것은 숨겨진 내용입니다]',
        result: '처음에는 숨겨져 있음',
      },
      {
        name: 'show',
        syntax: '(show: ?hookName)',
        description: '숨겨진 hook을 표시합니다.',
        example: '(link: "비밀 보기")[(show: ?secret)]',
        result: '클릭하면 숨겨진 내용이 표시됨',
      },
      {
        name: 'hide',
        syntax: '(hide: ?hookName)',
        description: '표시된 hook을 숨깁니다.',
        example: '(hide: ?secret)',
        result: 'hook이 다시 숨겨짐',
      },
    ],
  },
];

interface MacroGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacroGuideModal: React.FC<MacroGuideModalProps> = ({ isOpen, onClose }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(MACRO_CATEGORIES.map((c) => c.name))
  );
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedCategories(newExpanded);
  };

  const copyToClipboard = async (text: string, macroName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(macroName);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Macro Guide</h2>
            <p className="text-sm text-gray-500 mt-1">
              사용 가능한 Twine 스타일 매크로 목록입니다. 예제를 클릭하여 복사할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {MACRO_CATEGORIES.map((category) => (
            <div
              key={category.name}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  {category.macros.length}
                </span>
              </button>

              {/* Macros */}
              {expandedCategories.has(category.name) && (
                <div className="divide-y divide-gray-100">
                  {category.macros.map((macro) => (
                    <div key={macro.name} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{macro.name}</h4>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded text-primary-700">
                            {macro.syntax}
                          </code>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{macro.description}</p>

                      {/* Example */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            Example
                          </span>
                          <button
                            onClick={() => copyToClipboard(macro.example, macro.name)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                          >
                            {copiedExample === macro.name ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-white rounded p-2 border border-gray-200">
                          {macro.example}
                        </pre>
                        {macro.result && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              Result
                            </span>
                            <p className="text-sm text-gray-700 mt-1">{macro.result}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            더 많은 정보는{' '}
            <a
              href="https://twine2.neocities.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Twine/Harlowe 문서
            </a>
            를 참고하세요.
          </p>
        </div>
      </div>
    </div>
  );
};
