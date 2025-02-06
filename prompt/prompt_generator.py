import openai
import os
from dotenv import load_dotenv
from prompt.prompt_guideline import PROMPT_GUIDELINE  # 가이드라인 파일 import

# .env 파일 로드
load_dotenv()

# OpenAI API 키 가져오기
api_key = os.getenv("OPENAI_API_KEY")

# OpenAI 클라이언트 생성
client = openai.OpenAI(api_key=api_key)

def generate_prompt(user_input):
    """사용자의 입력을 바탕으로 최적의 프롬프트를 생성"""
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": PROMPT_GUIDELINE},  # 🎯 Markdown 출력 강제
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content.strip()  # 불필요한 공백 제거

if __name__ == "__main__":
    # 테스트 실행
    test_input = "음식 추천 프롬프트를 만들어줘."
    print(generate_prompt(test_input))
