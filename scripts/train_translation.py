from transformers import T5Tokenizer, T5ForConditionalGeneration, Seq2SeqTrainer, Seq2SeqTrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset, Dataset
import pandas as pd
import os

# === Path & setting ===
csv_path = "../dataset/translation/ind-jv.csv"
model_save_path = "../model/translation"
os.makedirs(model_save_path, exist_ok=True)

# === Load data paralel dari CSV ===
df = pd.read_csv(csv_path)
dataset = Dataset.from_pandas(df)

# === Load tokenizer dan model (T5 Base) ===
model_name = "google/mt5-small"  # Bisa ganti ke "t5-small"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

# === Preprocessing Function ===
def preprocess(example):
    input_text = "translate Indonesian to Javanese: " + example["source"]
    target_text = example["target"]
    inputs = tokenizer(input_text, truncation=True, padding="max_length", max_length=128)
    targets = tokenizer(target_text, truncation=True, padding="max_length", max_length=128)
    inputs["labels"] = targets["input_ids"]
    return inputs

# === Preprocess dataset ===
tokenized_dataset = dataset.map(preprocess)

# === Training Arguments ===
training_args = Seq2SeqTrainingArguments(
    output_dir=model_save_path,
    overwrite_output_dir=True,
    evaluation_strategy="no",
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    learning_rate=5e-5,
    num_train_epochs=5,
    save_total_limit=2,
    predict_with_generate=True,
    logging_steps=50,
)

# === Data Collator ===
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

# === Trainer ===
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator,
)

# === Train and Save ===
trainer.train()
trainer.save_model(model_save_path)
tokenizer.save_pretrained(model_save_path)

print(f"Model terjemahan disimpan di {model_save_path}")
