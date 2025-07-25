from flask import Flask, request, jsonify
from transformers import MarianMTModel, MarianTokenizer

app = Flask(__name__)

model_name = "Helsinki-NLP/opus-mt-id-jv"  # Indo → Jawa
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    inputs = tokenizer([text], return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    result = tokenizer.batch_decode(translated, skip_special_tokens=True)[0]
    return jsonify({'translation': result})

if __name__ == '__main__':
    app.run(port=8000)