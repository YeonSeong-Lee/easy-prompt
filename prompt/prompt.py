from prompt_generator import generate_prompt

while True:
    user_input = input("프롬프트 생성 요청을 입력하세요 (종료하려면 'exit' 입력): ")
    if user_input.lower() == "exit":
        print("대화를 종료합니다.")
        break 

    optimized_prompt = generate_prompt(user_input)
    print("\n🎯 최적화된 프롬프트:\n")
    print(optimized_prompt)
    print("\n" + "-" * 50)
