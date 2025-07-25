from transformers import GPT2Tokenizer, GPT2LMHeadModel, TextDataset, DataCollatorForLanguageModeling, Trainer, TrainingArguments
import os

# === Path & setting ===
dataset_path = "../dataset/monolingual/jawakringgil.txt"
model_save_path = "../model/monolingual"
os.makedirs(model_save_path, exist_ok=True)

# === Load tokenizer dan model GPT2 ===
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")

# Tokenizer GPT2 tidak punya pad token, jadi kita set manual
tokenizer.pad_token = tokenizer.eos_token
model.resize_token_embeddings(len(tokenizer))

# === Siapkan dataset ===
dataset = TextDataset(
    tokenizer=tokenizer,
    file_path=dataset_path,
    block_size=128,
)

data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,  # Causal LM (auto-regressive)
)

# === Training Config ===
training_args = TrainingArguments(
    output_dir=model_save_path,
    overwrite_output_dir=True,
    num_train_epochs=3,
    per_device_train_batch_size=4,
    save_steps=500,
    save_total_limit=2,
    prediction_loss_only=True,
    logging_steps=100,
)

trainer = Trainer(
    model=model,
    args=training_args,
    data_collator=data_collator,
    train_dataset=dataset,
)

# === Mulai Training ===
trainer.train()
trainer.save_model(model_save_path)
tokenizer.save_pretrained(model_save_path)

print(f"Model disimpan di {model_save_path}")
